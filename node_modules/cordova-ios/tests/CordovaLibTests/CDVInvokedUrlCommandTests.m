/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */

#import <XCTest/XCTest.h>

#import <Cordova/CDVInvokedUrlCommand.h>

@interface CDVInvokedUrlCommandTests : XCTestCase
@end

@implementation CDVInvokedUrlCommandTests

- (void)testInitWithNoArgs
{
    NSArray* jsonArr = [NSArray arrayWithObjects:@"callbackId", @"className", @"methodName", [NSArray array], nil];
    CDVInvokedUrlCommand* command = [CDVInvokedUrlCommand commandFromJson:jsonArr];

    XCTAssertEqual(@"callbackId", command.callbackId);
    XCTAssertEqual(@"className", command.className);
    XCTAssertEqual(@"methodName", command.methodName);
    XCTAssertEqual([NSArray array], command.arguments);
}

- (void)testArgumentAtIndex
{
    NSArray* jsonArr = [NSArray arrayWithObjects:[NSNull null], @"className", @"methodName", [NSArray array], nil];
    CDVInvokedUrlCommand* command = [CDVInvokedUrlCommand commandFromJson:jsonArr];

    XCTAssertNil([command argumentAtIndex:0], @"NSNull to nil");
    XCTAssertNil([command argumentAtIndex:100], @"Invalid index to nil");
    XCTAssertEqual(@"default", [command argumentAtIndex:0 withDefault:@"default"], @"NSNull to default");
    XCTAssertEqual(@"default", [command argumentAtIndex:100 withDefault:@"default"], @"Invalid index to default");
}

@end
