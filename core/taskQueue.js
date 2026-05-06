import eventBus from "./eventBus.js";

// Min-heap: lowest priority number = highest urgency
class PriorityQueue {
  constructor() {
    this._heap = [];
  }

  push(task) {
    this._heap.push(task);
    this._bubbleUp(this._heap.length - 1);
  }

  pop() {
    if (this._heap.length === 0) return null;
    const top = this._heap[0];
    const last = this._heap.pop();
    if (this._heap.length > 0) {
      this._heap[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  peek() {
    return this._heap[0] || null;
  }

  get size() {
    return this._heap.length;
  }

  _bubbleUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this._heap[parent].priority <= this._heap[i].priority) break;
      [this._heap[parent], this._heap[i]] = [this._heap[i], this._heap[parent]];
      i = parent;
    }
  }

  _sinkDown(i) {
    const n = this._heap.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < n && this._heap[l].priority < this._heap[smallest].priority) smallest = l;
      if (r < n && this._heap[r].priority < this._heap[smallest].priority) smallest = r;
      if (smallest === i) break;
      [this._heap[smallest], this._heap[i]] = [this._heap[i], this._heap[smallest]];
      i = smallest;
    }
  }
}

const queue = new PriorityQueue();
let processorRunning = false;

export function enqueue(task) {
  queue.push({
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    priority: task.priority ?? 5,
    type: task.type || "generic",
    payload: task.payload || {},
    createdAt: Date.now(),
    ...task
  });
  eventBus.emit("task:enqueued", queue.peek());
}

export function dequeue() {
  return queue.pop();
}

export function peek() {
  return queue.peek();
}

export function size() {
  return queue.size;
}

export function drain() {
  const all = [];
  while (queue.size > 0) all.push(queue.pop());
  return all;
}
