import { useUpdatePropertyMutation } from "@/ee/base/queries/base-property-query";
import { useBaseQuery } from "@/ee/base/queries/base-query";
import {
  FormulaTypeOptions,
  IBaseProperty,
  TypeOptions,
} from "@/ee/base/types/base.types";
import { FormulaEditor } from "./formula-editor";

type Props = {
  property: IBaseProperty;
  pageId: string;
  onClose: () => void;
};

export function FormulaPropertyEditor({ property, pageId, onClose }: Props) {
  const { data: base } = useBaseQuery(pageId);
  const updatePropertyMutation = useUpdatePropertyMutation();
  const opts = property.typeOptions as FormulaTypeOptions | undefined;

  return (
    <FormulaEditor
      editingPropertyId={property.id}
      initialSource={opts?.source ?? ""}
      name={property.name}
      onCancel={onClose}
      onSave={(source, ast, resultType, dependencies) => {
        if (source === (opts?.source ?? "")) {
          onClose();
          return;
        }
        updatePropertyMutation.mutate({
          pageId,
          propertyId: property.id,
          typeOptions: {
            ast,
            astVersion: 1,
            dependencies,
            resultType,
            source,
          } as TypeOptions,
        });
        onClose();
      }}
      properties={base?.properties ?? []}
    />
  );
}
