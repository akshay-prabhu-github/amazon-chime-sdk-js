// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import NoOpDeviceController, {
  DestroyableNoOpDeviceController,
} from '../../src/devicecontroller/NoOpDeviceController';
import NoOpEventReporter from '../../src/eventreporter/NoOpEventReporter';
import NoOpLogger from '../../src/logger/NoOpLogger';
import DefaultMeetingSession from '../../src/meetingsession/DefaultMeetingSession';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultMeetingSession', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  const OPERA_USERAGENT = 'Opera/9.80 (Windows NT 6.1; WOW64) Presto/2.12.388 Version/12.18';

  const setUserAgent = (userAgent: string): void => {
    // @ts-ignore
    navigator.userAgent = userAgent;
  };

  describe('constructor', () => {
    it('can be constructed and disposed of', async () => {
      const mockBuilder = new DOMMockBuilder();
      const deviceController = new DestroyableNoOpDeviceController();
      const session = new DefaultMeetingSession(
        new NoOpAudioVideoController().configuration,
        new NoOpLogger(),
        deviceController
      );
      expect(session).to.exist;
      expect(session.audioVideo).to.exist;
      expect(session.configuration).to.exist;
      expect(session.logger).to.exist;
      expect(session.deviceController).to.exist;
      expect(session.contentShare).to.exist;
      mockBuilder.cleanup();
      expect(deviceController.destroyed).to.be.false;
      const csController = session.contentShare;

      await session.destroy();
      expect(session.contentShare).to.be.undefined;
      expect(session.deviceController).to.be.undefined;
      expect(deviceController.destroyed).to.be.false;
      // @ts-ignore
      expect(csController.destroyed).to.be.true;

      deviceController.destroy();
      expect(deviceController.destroyed).to.be.true;

      // This is safe to call twice.
      await session.destroy();
    });

    it('can be constructed with an unsupported browser', () => {
      const mockBuilder = new DOMMockBuilder();
      setUserAgent(OPERA_USERAGENT);
      const session = new DefaultMeetingSession(
        new NoOpAudioVideoController().configuration,
        new NoOpLogger(),
        new NoOpDeviceController()
      );
      expect(session).to.exist;
      mockBuilder.cleanup();
    });

    it('can be constructed with simulcast feature for chromium-based browsers', () => {
      const domBehavior = new DOMMockBehavior();
      domBehavior.browserName = 'chrome';
      const mockBuilder = new DOMMockBuilder(domBehavior);
      const config = new NoOpAudioVideoController().configuration;

      config.enableUnifiedPlanForChromiumBasedBrowsers = true;
      config.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = true;
      let session = new DefaultMeetingSession(config, new NoOpLogger(), new NoOpDeviceController());
      expect(session).to.exist;
      expect(session.configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers).to.equal(
        true
      );
      expect(session.configuration.enableUnifiedPlanForChromiumBasedBrowsers).to.equal(true);

      config.enableUnifiedPlanForChromiumBasedBrowsers = false;
      config.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = true;
      session = new DefaultMeetingSession(config, new NoOpLogger(), new NoOpDeviceController());
      expect(session).to.exist;
      expect(session.configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers).to.equal(
        false
      );
      expect(session.configuration.enableUnifiedPlanForChromiumBasedBrowsers).to.equal(false);
      mockBuilder.cleanup();
    });

    it('can be constructed with simulcast feature switched off for firefox', () => {
      const domBehavior = new DOMMockBehavior();
      domBehavior.browserName = 'firefox';
      const mockBuilder = new DOMMockBuilder(domBehavior);

      const config = new NoOpAudioVideoController().configuration;

      config.enableUnifiedPlanForChromiumBasedBrowsers = true;
      config.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = true;
      const session = new DefaultMeetingSession(
        config,
        new NoOpLogger(),
        new NoOpDeviceController()
      );
      expect(session).to.exist;
      expect(session.configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers).to.equal(
        false
      );
      expect(session.configuration.enableUnifiedPlanForChromiumBasedBrowsers).to.equal(true);
      mockBuilder.cleanup();
    });

    it('will not construct event reporter if event ingestion URL is not present', async () => {
      const mockBuilder = new DOMMockBuilder();
      const session = new DefaultMeetingSession(
        new NoOpAudioVideoController().configuration,
        new NoOpLogger(),
        new NoOpDeviceController()
      );
      expect(session).to.exist;
      expect(session.eventReporter).to.be.undefined;
      mockBuilder.cleanup();
      await session.destroy();

      // This is safe to call twice.
      await session.destroy();
    });

    it('constructs event reporter if event ingestion URL is valid', async () => {
      const mockBuilder = new DOMMockBuilder();
      const configuration = new NoOpAudioVideoController().configuration;
      configuration.urls.eventIngestionURL = 'https://localhost:8080/client-events';
      const session = new DefaultMeetingSession(
        configuration,
        new NoOpLogger(),
        new NoOpDeviceController()
      );
      expect(session).to.exist;
      expect(session.eventReporter).to.exist;
      const eventReporter = session.eventReporter;
      await session.destroy();
      expect(session.eventReporter).to.be.undefined;
      // @ts-ignore
      expect(eventReporter.destroyed).to.be.true;
      // This is safe to call twice.
      mockBuilder.cleanup();
      await session.destroy();
    });

    it('can be constructed with a custom event reporter', () => {
      const mockBuilder = new DOMMockBuilder();
      const session = new DefaultMeetingSession(
        new NoOpAudioVideoController().configuration,
        new NoOpLogger(),
        new NoOpDeviceController(),
        new NoOpEventReporter()
      );
      expect(session).to.exist;
      expect(session.eventReporter).to.exist;
      mockBuilder.cleanup();
    });
  });
});
