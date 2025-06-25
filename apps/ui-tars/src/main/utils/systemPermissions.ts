/**
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */
// 使用动态导入来避免在模块加载时就出错
let screenCapturePermissions: any = null;
let permissions: any = null;

const loadPermissions = async () => {
  try {
    if (!screenCapturePermissions) {
      screenCapturePermissions = await import(
        '@computer-use/mac-screen-capture-permissions'
      );
    }
    if (!permissions) {
      permissions = (await import('@computer-use/node-mac-permissions'))
        .default;
    }
    return { screenCapturePermissions, permissions };
  } catch (error) {
    console.warn('Failed to load permission modules:', error);
    return { screenCapturePermissions: null, permissions: null };
  }
};

import * as env from '@main/env';
import { logger } from '@main/logger';

let hasScreenRecordingPermission = false;
let hasAccessibilityPermission = false;

const wrapWithWarning =
  (message, nativeFunction) =>
  (...args) => {
    console.warn(message);
    return nativeFunction(...args);
  };

const askForAccessibility = (
  nativeFunction,
  functionName,
  permissionsModule,
) => {
  if (!permissionsModule) {
    logger.warn('Permissions module not available for accessibility check');
    return nativeFunction;
  }

  const accessibilityStatus = permissionsModule.getAuthStatus('accessibility');
  logger.info('[accessibilityStatus]', accessibilityStatus);

  if (accessibilityStatus === 'authorized') {
    hasAccessibilityPermission = true;
    return nativeFunction;
  } else if (
    accessibilityStatus === 'not determined' ||
    accessibilityStatus === 'denied'
  ) {
    hasAccessibilityPermission = false;
    permissionsModule.askForAccessibilityAccess();
    return wrapWithWarning(
      `##### WARNING! The application running this script tries to access accessibility features to execute ${functionName}! Please grant requested access and visit https://github.com/nut-tree/nut.js#macos for further information. #####`,
      nativeFunction,
    );
  }
};
const askForScreenRecording = (
  nativeFunction,
  functionName,
  permissionsModule,
) => {
  if (!permissionsModule) {
    logger.warn('Permissions module not available for screen recording check');
    return nativeFunction;
  }

  const screenCaptureStatus = permissionsModule.getAuthStatus('screen');

  if (screenCaptureStatus === 'authorized') {
    hasScreenRecordingPermission = true;
    return nativeFunction;
  } else if (
    screenCaptureStatus === 'not determined' ||
    screenCaptureStatus === 'denied'
  ) {
    hasScreenRecordingPermission = false;
    permissionsModule.askForScreenCaptureAccess();
    return wrapWithWarning(
      `##### WARNING! The application running this script tries to screen recording features to execute ${functionName}! Please grant the requested access for further information. #####`,
      nativeFunction,
    );
  }
};

export const ensurePermissions = async (): Promise<{
  screenCapture: boolean;
  accessibility: boolean;
}> => {
  if (env.isE2eTest) {
    return {
      screenCapture: true,
      accessibility: true,
    };
  }

  const { screenCapturePermissions, permissions: permissionsModule } =
    await loadPermissions();

  if (!screenCapturePermissions || !permissionsModule) {
    logger.warn(
      'Permission modules not available, returning default permissions',
    );
    return {
      screenCapture: false,
      accessibility: false,
    };
  }

  logger.info(
    'Has asked permissions?',
    screenCapturePermissions.hasPromptedForPermission(),
  );

  hasScreenRecordingPermission =
    screenCapturePermissions.hasScreenCapturePermission();
  logger.info('Has permissions?', hasScreenRecordingPermission);
  logger.info(
    'Has asked permissions?',
    screenCapturePermissions.hasPromptedForPermission(),
  );

  if (!hasScreenRecordingPermission) {
    screenCapturePermissions.openSystemPreferences();
  }

  askForAccessibility(() => {}, 'execute accessibility', permissionsModule);
  askForScreenRecording(
    () => {},
    'execute screen recording',
    permissionsModule,
  );

  logger.info(
    '[ensurePermissions] hasScreenRecordingPermission',
    hasScreenRecordingPermission,
    'hasAccessibilityPermission',
    hasAccessibilityPermission,
  );

  return {
    screenCapture: hasScreenRecordingPermission,
    accessibility: hasAccessibilityPermission,
  };
};
