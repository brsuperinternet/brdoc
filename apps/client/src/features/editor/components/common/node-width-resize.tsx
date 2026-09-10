import { Slider } from "@mantine/core";
import { memo, useCallback, useLayoutEffect, useState } from "react";

export type ImageWidthProps = {
  onChange: (value: number) => void;
  value: number;
  width?: string;
};

export const NodeWidthResize = memo(
  ({ onChange, value, width }: ImageWidthProps) => {
    const [currentValue, setCurrentValue] = useState(value);

    useLayoutEffect(() => {
      setCurrentValue(value);
    }, [value]);

    const handleChangeEnd = useCallback(
      (newValue: number) => {
        onChange(newValue);
      },
      [onChange]
    );

    return (
      <Slider
        label={(value) => `${value}%`}
        min={10}
        onChange={setCurrentValue}
        onChangeEnd={handleChangeEnd}
        p={"sm"}
        value={currentValue}
        w={width || 100}
      />
    );
  }
);
