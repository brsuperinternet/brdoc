import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import classes from "@/ee/base/styles/grid.module.css";

type Props = {
  edge: Edge;
};

export function BaseDropEdgeIndicator({ edge }: Props) {
  return <div aria-hidden className={classes.dropEdgeLine} data-edge={edge} />;
}
