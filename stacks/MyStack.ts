import { Bucket, SvelteKitSite } from "sst/constructs";
import type { StackContext } from "sst/constructs"

export function MyStack({ stack }: StackContext) {

  const bucket = new Bucket(stack, "bucket", {
    cors: [
      {
        allowedMethods: [
          "GET",
          "POST",
          "DELETE",
          "PUT"
        ],
        allowedOrigins: ["*"],
        allowedHeaders: ["*"],
      }
    ]
  })
  const site = new SvelteKitSite(stack, "Kuvagalleria", {
    bind: [bucket]
  })
  stack.addOutputs({
    url: site.url,
  })
}
