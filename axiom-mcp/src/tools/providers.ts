import type { Logger } from '../config.js';
import type { McpToolBinary } from './binaries.js';
import type { BinaryToolProvider } from './handler.js';
import { XclogTools } from './xclog.js';
import { XcprofTools } from './xcprof.js';
import { XcsymTools } from './xcsym.js';

/** The server's wrapped-binary tool providers, keyed by binary; every consumer builds them here. */
export function createBinaryToolProviders(
  opts: { paths: Record<McpToolBinary, string>; logger?: Logger },
): Record<McpToolBinary, BinaryToolProvider> {
  return {
    xcprof: new XcprofTools({ binaryPath: opts.paths.xcprof, logger: opts.logger }),
    xclog: new XclogTools({ binaryPath: opts.paths.xclog, logger: opts.logger }),
    xcsym: new XcsymTools({ binaryPath: opts.paths.xcsym, logger: opts.logger }),
  };
}
