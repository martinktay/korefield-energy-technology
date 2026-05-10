import { Controller, Get } from "@nestjs/common";

export interface HealthResponse {
  status: "healthy";
  service: "backend";
  timestamp: string;
}

@Controller("health")
export class HealthController {
  @Get()
  health(): HealthResponse {
    return {
      status: "healthy",
      service: "backend",
      timestamp: new Date().toISOString(),
    };
  }
}
