import React from "react";

function Button({ children, ...props }: React.PropsWithChildren<{}>) {
  return (
    <button title="标题" {...props}>
      {children}
    </button>
  );
}

export default Button;
