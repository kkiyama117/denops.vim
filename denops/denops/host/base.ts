import { Service } from "../service.ts";
import { denops } from "../deps.ts";

/**
 * A Host (Vim/Neovim) interface.
 */
export interface Host extends denops.HostService {
  /**
   * Register service which is visible from the host through RPC.
   */
  registerService(service: Service): void;

  /**
   * Wait until the host is closed
   */
  waitClosed(): Promise<void>;
}

export abstract class AbstractHost implements Host {
  abstract command(expr: string): Promise<void>;
  abstract eval(expr: string): Promise<unknown>;
  abstract call(fn: string, args: unknown[]): Promise<unknown>;
  abstract registerService(sservice: Service): void;
  abstract waitClosed(): Promise<void>;

  async echo(text: string): Promise<void> {
    await this.call("denops#api#echo", [text]);
  }

  async echomsg(text: string): Promise<void> {
    await this.call("denops#api#echomsg", [text]);
  }

  async getvar(group: denops.VariableGroup, prop: string): Promise<unknown> {
    return await this.call("denops#api#getvar", [group, prop]);
  }

  async setvar(
    group: denops.VariableGroup,
    prop: string,
    value: unknown
  ): Promise<void> {
    await this.call("denops#api#setvar", [group, prop, value]);
  }
}
