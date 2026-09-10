import {
  buildResizeClasses,
  createResizeHandle,
} from "../common/node-resize-handles";

export const createImageHandle = createResizeHandle;
export const imageResizeClasses = buildResizeClasses("node-image");
