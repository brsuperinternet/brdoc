export type BacklinkDirection = "incoming" | "outgoing";

export interface IBacklinkCount {
  incoming: number;
  outgoing: number;
}

export interface IBacklinkPageItem {
  icon: string | null;
  id: string;
  slugId: string;
  space: { id: string; slug: string; name: string } | null;
  spaceId: string;
  title: string | null;
  updatedAt: string;
}

export interface IBacklinksListParams {
  cursor?: string;
  direction: BacklinkDirection;
  limit?: number;
  pageId: string;
}
