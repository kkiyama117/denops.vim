import {
  Dispatcher,
  Session,
} from "./vendor/https/deno.land/x/msgpack_rpc/mod.ts";

/**
 * Context which is expanded to the local namespace (l:)
 */
export type Context = Record<string, unknown>;

export type Meta = {
  readonly mode: "release" | "debug" | "test";
  readonly host: "vim" | "nvim";
  readonly version: string;
  readonly platform: "windows" | "mac" | "linux";
};

export class BatchError extends Error {
  readonly results: unknown[];

  constructor(message: string, results: unknown[]) {
    super(message);
    this.name = "BatchError";
    this.results = results;
  }
}

/**
 * Denpos is a facade instance visible from each denops plugins.
 */
export interface Denops {
  /**
   * Denops instance name which uses to communicate with vim.
   */
  readonly name: string;

  /**
   * Environment meta information.
   */
  readonly meta: Meta;

  /**
   * User defined API name and method map which is used to dispatch API request
   */
  dispatcher: Dispatcher;

  /**
   * Call an arbitrary function of Vim/Neovim and return the result
   *
   * @param fn: A function name of Vim/Neovim.
   * @param args: Arguments of the function.
   */
  call(fn: string, ...args: unknown[]): Promise<unknown>;

  /**
   * Call arbitrary functions of Vim/Neovim sequentially without redraw and
   * return the results.
   *
   * It throw a BatchError when one of a function fails. The `results` attribute
   * of the error instance holds successed results of functions prior to the
   * error.
   *
   * @param calls: A list of tuple ([fn, args]) to call Vim/Neovim functions.
   */
  batch(...calls: [string, ...unknown[]][]): Promise<unknown[]>;

  /**
   * Execute an arbitrary command of Vim/Neovim under a given context.
   *
   * @param cmd: A command expression to be executed.
   * @param ctx: A context object which is expanded to the local namespace (l:)
   */
  cmd(cmd: string, ctx?: Context): Promise<void>;

  /**
   * Evaluate an arbitrary expression of Vim/Neovim under a given context and return the result.
   *
   * @param expr: An expression to be evaluated.
   * @param ctx: A context object which is expanded to the local namespace (l:)
   */
  eval(expr: string, ctx?: Context): Promise<unknown>;

  /**
   * Dispatch an arbitrary function of an arbitrary plugin and return the result.
   *
   * @param name: A plugin registration name.
   * @param fn: A function name in the API registration.
   * @param args: Arguments of the function.
   */
  dispatch(name: string, fn: string, ...args: unknown[]): Promise<unknown>;
}

export class DenopsImpl implements Denops {
  readonly name: string;
  readonly meta: Meta;
  #session: Session;

  constructor(
    name: string,
    meta: Meta,
    session: Session,
  ) {
    this.name = name;
    this.meta = meta;
    this.#session = session;
  }

  get dispatcher(): Dispatcher {
    return this.#session.dispatcher;
  }

  set dispatcher(dispatcher: Dispatcher) {
    this.#session.dispatcher = dispatcher;
  }

  async call(fn: string, ...args: unknown[]): Promise<unknown> {
    return await this.#session.call("call", fn, ...args);
  }

  async batch(
    ...calls: [string, ...unknown[]][]
  ): Promise<unknown[]> {
    const [results, errmsg] = await this.#session.call("batch", ...calls) as [
      unknown[],
      string,
    ];
    if (errmsg !== "") {
      throw new BatchError(errmsg, results);
    }
    return results;
  }

  async cmd(cmd: string, ctx: Context = {}): Promise<void> {
    await this.#session.call("call", "denops#api#cmd", cmd, ctx);
  }

  async eval(expr: string, ctx: Context = {}): Promise<unknown> {
    return await this.#session.call("call", "denops#api#eval", expr, ctx);
  }

  async dispatch(
    name: string,
    fn: string,
    ...args: unknown[]
  ): Promise<unknown> {
    return await this.#session.call("dispatch", name, fn, ...args);
  }
}
