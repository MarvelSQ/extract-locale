import React from "react";
import { Select as ASelect, Divider, SelectProps } from "antd";

function Select({
  renderFooter,
  ...props
}: SelectProps & {
  renderFooter?: (props: SelectProps) => JSX.Element;
}) {
  return (
    <ASelect
      {...props}
      dropdownRender={(menu) => {
        const footer = renderFooter?.(props);

        return (
          <>
            {menu}
            {footer && <Divider style={{ margin: "8px 0" }} />}
            {footer}
          </>
        );
      }}
    />
  );
}

export default Select;
