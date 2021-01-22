import * as grpc from 'grpc-web';
import { RpcError } from '../common/error'

/**
 * Converts a non-reactive gRPC error to an error type provided by this package.
 * @param error The error to be converted.
 */
export function toReactiveError(error: unknown): RpcError {
  let code = RpcError.StatusCode.UNKNOWN;
  let message = 'Something went wrong.';
  if (typeof error === 'object' && error != null) {
    const grpcError = error as grpc.Error;
    if (typeof grpcError.code === 'number') code = grpcError.code;
    if (typeof grpcError.message === 'string') message = grpcError.message;
  }
  return new RpcError(code, message);
}
