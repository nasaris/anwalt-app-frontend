import { setupWorker } from 'msw/browser';
import { faelleHandlers } from './handlers/faelle';
import { mandantenHandlers } from './handlers/mandanten';
import { parteienHandlers, wiedervorlagenHandlers } from './handlers/parteien';
import { schriftverkehrHandlers } from './handlers/schriftverkehr';

export const worker = setupWorker(
  ...faelleHandlers,
  ...mandantenHandlers,
  ...parteienHandlers,
  ...wiedervorlagenHandlers,
  ...schriftverkehrHandlers
);
