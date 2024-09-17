import { AzureNamedKeyCredential, TableClient } from "@azure/data-tables";

const credential = new AzureNamedKeyCredential(process.env.AZURE_TABLES_ACCOUNT_NAME, process.env.AZURE_TABLES_ACCOUNT_KEY);

export const getTableClient = (tableName: string) => {
  return new TableClient(
    `https://${process.env.AZURE_TABLES_ACCOUNT_NAME}.table.core.windows.net`, tableName, credential
  );
}