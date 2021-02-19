import moment from 'moment';
import chunk from 'lodash/chunk';
import { IWorkstation, IOrder } from './interfaces';

type QueueState = Map<Date, number>;

type IActiveWorkstation = IWorkstation & { queue: QueueState };

export interface Queue {
  getTotalProcessingTime(): number;
  estimate(order: IOrder): number;
  schedule(order: IOrder): number;
}

export const getFirstSlot = (state: QueueState) =>
  Array.from(state).shift() || [];

export const getLastSlot = (state: QueueState) => Array.from(state).pop() || [];

export const getWorkstationProcessingTime = (
  workstation: IActiveWorkstation,
  order: IOrder,
  referenceDate: Date
) => {
  let items = order.items.length;

  const startDate = moment(referenceDate).startOf('minute');
  let endDate = startDate.clone();

  const [lastSlotDate, lastSlotItems] = getLastSlot(workstation.queue);

  if (lastSlotDate && startDate.isSameOrBefore(lastSlotDate, 'minute')) {
    endDate = moment(lastSlotDate);

    if (lastSlotItems && lastSlotItems < workstation.capacity) {
      items -= workstation.capacity - lastSlotItems;
    } else {
      endDate.add(workstation.time, 'minute');
    }
  }

  if (items > 0) {
    const remainingProcessingTime =
      Math.ceil(items / workstation.capacity) * workstation.time;

    endDate.add(remainingProcessingTime, 'minute');
  }

  return endDate.diff(startDate, 'minute');
};

export const getOrderProcessingTime = (
  workstations: IActiveWorkstation[],
  order: IOrder
) => {
  let referenceDate = moment(order.date);

  return workstations.reduce((carry, workstation) => {
    const partial = getWorkstationProcessingTime(
      workstation,
      order,
      referenceDate.toDate()
    );

    referenceDate.add(partial, 'minute');

    return carry + partial;
  }, 0);
};

export const getTotalProcessingTime = (workstations: IActiveWorkstation[]) => {
  if (workstations.length) {
    const [firstSlotDate] = getFirstSlot(workstations[0].queue);
    const [lastSlotDate] = getLastSlot(
      workstations[workstations.length - 1].queue
    );

    if (firstSlotDate && lastSlotDate) {
      return moment(lastSlotDate).diff(firstSlotDate, 'minutes');
    }
  }

  return 0;
};

export const scheduleOrder = (
  workstations: IActiveWorkstation[],
  order: IOrder
) => {
  let referenceDate = moment(order.date);

  return workstations.reduce((carry, workstation) => {
    let assignableItems = order.items.length;
    let startDate = referenceDate.clone().startOf('minute');
    const [lastSlotDate, lastSlotItems] = getLastSlot(workstation.queue);

    if (
      lastSlotDate &&
      lastSlotItems &&
      referenceDate.isSameOrBefore(lastSlotDate, 'minute') &&
      workstation.capacity > lastSlotItems
    ) {
      startDate = moment(lastSlotDate);
      const lastSlotAssignableItems = workstation.capacity - lastSlotItems;

      if (lastSlotAssignableItems > assignableItems) {
        workstation.queue.set(lastSlotDate, lastSlotItems + assignableItems);
      } else {
        workstation.queue.set(lastSlotDate, workstation.capacity);
      }

      assignableItems -= lastSlotAssignableItems;
    }

    if (assignableItems > 0) {
      chunk(new Array(assignableItems), workstation.capacity).forEach(
        (chunkItems, index) => {
          workstation.queue.set(
            startDate
              .clone()
              .add(index * workstation.time, 'minute')
              .toDate(),
            chunkItems.length
          );
        }
      );
    }

    const partial = getWorkstationProcessingTime(
      workstation,
      order,
      referenceDate.toDate()
    );

    referenceDate.add(partial, 'minute');

    return partial;
  }, 0);
};

export const create = (config: { workstations: IWorkstation[] }): Queue => {
  const workstations: IActiveWorkstation[] = config.workstations.map(
    (workstation) => ({
      ...workstation,
      queue: new Map(),
    })
  );

  return {
    getTotalProcessingTime: () => getTotalProcessingTime(workstations),
    estimate: (order: IOrder) => getOrderProcessingTime(workstations, order),
    schedule: (order: IOrder) => scheduleOrder(workstations, order),
  };
};
