import moment from 'moment';
import chunk from 'lodash/chunk';
import { IWorkstation, IOrder } from './interfaces';
import { assign } from 'lodash';

type QueueState = Map<number, number>;

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

  // the workstation can't process an order till the capacity is full
  // so we need to fetch the last slot and see if there is any empty space to
  // process at least part of this order
  const [lastSlotDate, lastSlotItems] = getLastSlot(workstation.queue);

  if (lastSlotDate && startDate.isSameOrBefore(lastSlotDate, 'minute')) {
    endDate = moment(lastSlotDate).add(workstation.time, 'minute');

    if (lastSlotItems && lastSlotItems < workstation.capacity) {
      items -= workstation.capacity - lastSlotItems;
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
      return moment
        .unix(lastSlotDate)
        .add(workstations[workstations.length - 1].time, 'minute')
        .diff(moment.unix(firstSlotDate), 'minute');
    }
  }

  return 0;
};

export const scheduleOrder = (
  workstations: IActiveWorkstation[],
  order: IOrder
) => {
  let referenceDate = moment(order.date).startOf('minute');

  return workstations.reduce((carry, workstation) => {
    const partial = getWorkstationProcessingTime(
      workstation,
      order,
      referenceDate.toDate()
    );

    let assignableItems = order.items.length;
    let startDate = referenceDate.clone();

    const [lastSlotDate, lastSlotItems] = getLastSlot(workstation.queue);

    if (
      lastSlotDate &&
      referenceDate.isSameOrBefore(moment.unix(lastSlotDate), 'minute')
    ) {
      startDate = moment.unix(lastSlotDate).add(workstation.time, 'minute');

      if (lastSlotItems && workstation.capacity > lastSlotItems) {
        const lastSlotAssignableItems = workstation.capacity - lastSlotItems;

        if (lastSlotAssignableItems > assignableItems) {
          workstation.queue.set(lastSlotDate, lastSlotItems + assignableItems);
        } else {
          workstation.queue.set(lastSlotDate, workstation.capacity);
        }

        assignableItems -= lastSlotAssignableItems;
      }
    }

    if (assignableItems > 0) {
      chunk(new Array(assignableItems), workstation.capacity).forEach(
        (chunkItems, index) => {
          workstation.queue.set(startDate.unix(), chunkItems.length);
          startDate.add(workstation.time, 'minute');
        }
      );
    }

    // console.log(workstation.id, order.id, workstation.queue);
    referenceDate.add(partial, 'minute');
    return carry + partial;
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
