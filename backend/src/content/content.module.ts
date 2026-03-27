/**
 * @file content.module.ts
 * NestJS module for the content domain.
 * Manages curriculum structure (tracks, levels, modules, lessons),
 * lab sessions, and sandboxed coding exercise execution.
 */
import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { CodeExecutionService } from './code-execution.service';

@Module({
  controllers: [ContentController],
  providers: [ContentService, CodeExecutionService],
  exports: [ContentService, CodeExecutionService],
})
export class ContentModule {}
