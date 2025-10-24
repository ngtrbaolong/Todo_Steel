export const getAllTasks = (request, response) => {
    response.status(200).send("Bạn có 20 việc cần làm");
};

export const createTask = (request, response) => {
    response.status(201).json("Tạo mới nhiệm vụ thành công");
};

export const updateTask = (request, response) => {
    response.status(200).json("Nhiệm vụ đã được update thành công");
};

export const deleteTask = (request, response) => {
    response.status(200).json("Nhiệm vụ đã được xóa thành công");
}
