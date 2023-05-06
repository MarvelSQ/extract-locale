import { Button } from "antd";
import React from "react";

function Control({
  loading,
  onConfirm,
}: {
  loading: boolean;
  onConfirm: () => void;
}) {
  return (
    <div className="control-bar">
      <Button loading={loading} onClick={onConfirm}>
        Process Files
      </Button>
    </div>
  );
}

export default Control;
