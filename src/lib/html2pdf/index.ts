import createClient from "openapi-fetch";
import { paths } from "./v1";



export function createHtm2PdfClient(baseUrl: string) {
  return createClient<paths>({
    baseUrl: baseUrl
  });
}
