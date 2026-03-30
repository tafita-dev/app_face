#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>
#import <VisionCamera/VisionCameraProxy.h>
#import "AureliusSecureFace-Swift.h"

@interface FaceDetectorPlugin (FrameProcessorPluginRegistry)
@end

@implementation FaceDetectorPlugin (FrameProcessorPluginRegistry)

+ (void)load
{
    [FrameProcessorPluginRegistry addFrameProcessorPlugin:@"FaceDetectorPlugin"
                                        withInitializer:^FrameProcessorPlugin* (VisionCameraProxy* proxy, NSDictionary* options) {
        return [[FaceDetectorPlugin alloc] initWithProxy:proxy withOptions:options];
    }];
}

@end
