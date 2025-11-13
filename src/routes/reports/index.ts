import { type RequestHandler } from "@builder.io/qwik-city";
import { createHtm2PdfClient } from "~/lib/html2pdf";

export const onGet: RequestHandler = async ({ send, env }) => {
  const c = createHtm2PdfClient(env.get('HTML2PDF_URL')!);

  const d = await c.POST('/render', {
    body: `<html>
  <body>
    <h1>Test</h1>
    <p>test1234567890</p>
  </body>
</html>`,
    parseAs: "blob",
    bodySerializer: (body) => body
  });

  const headers = new Headers();
  headers.append('Content-Type', 'application/pdf');

  // Create a new Response object with the blob data and headers
  send(new Response(d.data, {
    status: 200,
    headers: headers
  }));
};
