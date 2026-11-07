import { NextResponse } from "next/server"

/**
 * Last-resort handler for a throw inside a route. Without this Next answers an
 * unhandled throw with a 500 and an *empty* body, which the forms then crash on
 * while parsing — the user sees a dead button and nothing reaches the logs.
 */
export function serverError(e: unknown) {
  console.error(e)
  return NextResponse.json(
    { error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." } },
    { status: 500 },
  )
}

/** Wraps a route handler so every throw becomes a logged JSON 500. */
export function withErrors<A extends unknown[]>(
  handler: (...args: A) => Promise<Response>,
): (...args: A) => Promise<Response> {
  return async (...args) => {
    try {
      return await handler(...args)
    } catch (e) {
      return serverError(e)
    }
  }
}
