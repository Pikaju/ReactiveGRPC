import * as grpc from "grpc";
import {
  ReactiveServerUnaryMethod,
  ReactiveServerRequestStreamMethod,
  ReactiveServerResponseStreamMethod,
  ReactiveServerBidirectionalStreamMethod,
} from "./server_methods";
import { observableFromServerStream } from "./observable_from_stream";

export function defineUnaryMethod<RequestType, ResponseType>(
  method: ReactiveServerUnaryMethod<RequestType, ResponseType>
): grpc.handleUnaryCall<RequestType, ResponseType> {
  return (
    call: grpc.ServerUnaryCall<RequestType>,
    callback: grpc.sendUnaryData<ResponseType>
  ): void => {
    const result = method(call.request, call);
    result.then(
      (value) => callback(null, value),
      (reason) => callback(reason, null)
    );
  };
}

export function defineRequestStreamMethod<RequestType, ResponseType>(
  method: ReactiveServerRequestStreamMethod<RequestType, ResponseType>
): grpc.handleClientStreamingCall<RequestType, ResponseType> {
  return (
    call: grpc.ServerReadableStream<RequestType>,
    callback: grpc.sendUnaryData<ResponseType>
  ): void => {
    const observable = observableFromServerStream<RequestType>(call);
    const result = method(observable, call);
    result.then(
      (value) => callback(null, value),
      (reason) => callback(reason, null)
    );
  };
}

export function defineResponseStreamMethod<RequestType, ResponseType>(
  method: ReactiveServerResponseStreamMethod<RequestType, ResponseType>
): grpc.handleServerStreamingCall<RequestType, ResponseType> {
  return (call: grpc.ServerWritableStream<RequestType>): void => {
    const result = method(call.request, call);
    const subscription = result.subscribe(
      (value) => call.write(value),
      (error) => call.destroy(error),
      () => call.end()
    );
    call.on("cancelled", () => subscription.unsubscribe());
  };
}

export function defineBidirectionalStreamMethod<RequestType, ResponseType>(
  method: ReactiveServerBidirectionalStreamMethod<RequestType, ResponseType>
): grpc.handleBidiStreamingCall<RequestType, ResponseType> {
  return (call: grpc.ServerDuplexStream<RequestType, ResponseType>): void => {
    const observable = observableFromServerStream<RequestType>(call);
    const result = method(observable, call);
    const subscription = result.subscribe(
      (value) => call.write(value),
      (error) => call.destroy(error),
      () => call.end()
    );
    call.on("cancelled", () => subscription.unsubscribe());
  };
}
