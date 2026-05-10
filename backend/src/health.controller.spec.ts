import { RequestMethod } from "@nestjs/common";
import {
  GUARDS_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from "@nestjs/common/constants";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  let controller: HealthController;

  beforeEach(() => {
    controller = new HealthController();
  });

  it("returns a small backend liveness payload", () => {
    const result = controller.health();

    expect(result.status).toBe("healthy");
    expect(result.service).toBe("backend");
    expect(typeof result.timestamp).toBe("string");
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });

  it("keeps the public response shape stable", () => {
    const result = controller.health();

    expect(Object.keys(result).sort()).toEqual([
      "service",
      "status",
      "timestamp",
    ]);
  });

  it("exposes GET /health without auth guards", () => {
    expect(Reflect.getMetadata(PATH_METADATA, HealthController)).toBe("health");
    expect(
      Reflect.getMetadata(METHOD_METADATA, HealthController.prototype.health),
    ).toBe(RequestMethod.GET);
    expect(Reflect.getMetadata(GUARDS_METADATA, HealthController)).toBe(
      undefined,
    );
    expect(
      Reflect.getMetadata(GUARDS_METADATA, HealthController.prototype.health),
    ).toBe(undefined);
  });
});
