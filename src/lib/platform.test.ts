import { describe, expect, it } from 'vitest';
import { detectPlatform } from './platform';

const UA = {
  iphoneSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  iphoneChrome:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1',
  iphoneInstagram:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 339.0.0.12.108',
  ipad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  androidChrome:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.71 Mobile Safari/537.36',
  androidSamsung:
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36',
  desktopChrome:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
};

describe('detectPlatform', () => {
  it.each([
    ['iphoneSafari', 0, 'ios', 'safari'],
    ['iphoneChrome', 0, 'ios', 'chrome'],
    ['iphoneInstagram', 0, 'ios', 'other'],
    ['ipad', 5, 'ios', 'safari'],
    ['ipad', 0, 'desktop', 'other'],
    ['androidChrome', 0, 'android', 'chrome'],
    ['androidSamsung', 0, 'android', 'other'],
    ['desktopChrome', 0, 'desktop', 'chrome'],
  ] as const)('%s (touch %i) → %s / %s', (key, touch, platform, browser) => {
    expect(detectPlatform(UA[key], touch)).toEqual({ platform, browser });
  });
});
