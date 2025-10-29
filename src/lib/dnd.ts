export interface DragData {
  todoId: string
  title: string
  subject: string
  durationMin: number
}

export function createDragData(todo: {
  id: string
  title: string
  subject: string
  durationMin: number
}): DragData {
  return {
    todoId: todo.id,
    title: todo.title,
    subject: todo.subject,
    durationMin: todo.durationMin
  }
}

export function parseDragData(dataTransfer: DataTransfer): DragData | null {
  try {
    const data = dataTransfer.getData('application/json')
    return JSON.parse(data) as DragData
  } catch {
    return null
  }
}

export function setDragData(dataTransfer: DataTransfer, data: DragData) {
  dataTransfer.setData('application/json', JSON.stringify(data))
}

