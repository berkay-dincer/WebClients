/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * Measures success rate of receiving custom password for publicly shared document
 */
export interface HttpsProtonMeDocsPublicSharingCustomPasswordSuccessRateTotalV1SchemaJson {
  Labels: {
    status: "success" | "did_not_receive" | "received_not_working";
  };
  Value: number;
}
