const { getIO } = require("../sockets/socketServer");

/**
 * Safely emit an event to a room.
 * If Socket.io isn't initialized (e.g., during tests), it silently no-ops.
 */
const emitToBoard = (boardId, event, payload) => {
  try {
    const io = getIO();
    io.to(`board:${boardId}`).emit(event, payload);
  } catch (err) {
    console.warn(`⚠️ Socket emit skipped (${event}):`, err.message);
  }
};

const emitToWorkspace = (workspaceId, event, payload) => {
  try {
    const io = getIO();
    io.to(`workspace:${workspaceId}`).emit(event, payload);
  } catch (err) {
    console.warn(`⚠️ Socket emit skipped (${event}):`, err.message);
  }
};

module.exports = { emitToBoard, emitToWorkspace };