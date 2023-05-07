import { Button } from "antd";
import React from "react";

function Control({
  loading,
  onConfirm,
  disabled,
}: {
  loading: boolean;
  onConfirm: () => void;
  disabled: boolean;
}) {
  return (
    <div className="control-bar">
      <Button loading={loading} onClick={onConfirm} disabled={disabled}>
        Process Files
      </Button>
    </div>
  );
}

export default Control;
