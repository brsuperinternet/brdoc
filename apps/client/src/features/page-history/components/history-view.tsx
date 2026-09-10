import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";
import {
  activeHistoryIdAtom,
  activeHistoryPrevIdAtom,
} from "@/features/page-history/atoms/history-atoms";
import { HistoryEditor } from "@/features/page-history/components/history-editor";
import { usePageHistoryQuery } from "@/features/page-history/queries/page-history-query";

interface Props {
  historyId?: string;
  prevHistoryId?: string;
}

function HistoryView({ historyId, prevHistoryId }: Props) {
  const { t } = useTranslation();
  const activeId = useAtomValue(activeHistoryIdAtom);
  const activePrevId = useAtomValue(activeHistoryPrevIdAtom);

  const resolvedId = historyId ?? activeId;
  const resolvedPrevId = prevHistoryId ?? activePrevId;

  const {
    data,
    isLoading: isLoadingCurrent,
    isError: isErrorCurrent,
  } = usePageHistoryQuery(resolvedId);
  const {
    data: prevData,
    isLoading: isLoadingPrev,
    isError: isErrorPrev,
  } = usePageHistoryQuery(resolvedPrevId);

  if (isLoadingCurrent || isLoadingPrev) {
    return <></>;
  }

  if (isErrorCurrent || !data) {
    return <div>{t("Error fetching page data.")}</div>;
  }

  return (
    <div>
      <HistoryEditor
        content={data.content}
        previousContent={isErrorPrev ? undefined : prevData?.content}
        title={data.title}
      />
    </div>
  );
}

export default HistoryView;
