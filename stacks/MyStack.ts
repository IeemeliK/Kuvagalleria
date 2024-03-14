import { Api, Bucket, SvelteKitSite } from "sst/constructs";
import type { StackContext } from "sst/constructs"

export function MyStack({ stack }: StackContext) {
  const mongoApi = new Api(stack, "mongoApi", {
    defaults: {
      function: {
        environment: {
          MONGODB_URI: process.env.MONGODB_URI as string,
        },
      },
    },
    routes: {
      "GET /": "functions/database.getData",
      "POST /": "functions/database.addData",
    },
  });

  const bucket = new Bucket(stack, "bucket", {
    cors: [
      {
        allowedMethods: [
          "GET",
          "POST",
          "DELETE"
        ],
        allowedOrigins: ["http://localhost:5173"],
        allowedHeaders: ["*"],
      }
    ]
  })
  const site = new SvelteKitSite(stack, "Kuvagalleria", {
    bind: [bucket, mongoApi]
  })
  stack.addOutputs({
    url: site.url,
    ApiEndpoint: mongoApi.url
  })
}