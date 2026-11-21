import React from 'react';
import { GoogleSheetSync } from './GoogleSheetSync';

export interface ExcelUploadProps {
  onCatalogUpdated?: () => void | Promise<void>;
  currentUserName?: string;
}

export const ExcelUpload: React.FC<ExcelUploadProps> = ({
  onCatalogUpdated,
  currentUserName,
}) => {
  return (
    <GoogleSheetSync
      onCatalogUpdated={onCatalogUpdated}
      currentUserName={currentUserName}
    />
  );
};