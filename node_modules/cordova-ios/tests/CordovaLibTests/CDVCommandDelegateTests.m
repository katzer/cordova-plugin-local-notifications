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
#import <Cordova/CDVCommandDelegateImpl.h>

@interface CDVCommandDelegateTests : XCTestCase

@end

@interface CDVCommandDelegateImpl ()

// expose private interface
- (BOOL)isValidCallbackId:(NSString*)callbackId;

@end

@implementation CDVCommandDelegateTests

- (void)setUp
{
    [super setUp];
    // Put setup code here. This method is called before the invocation of each test method in the class.
}

- (void)tearDown
{
    // Put teardown code here. This method is called after the invocation of each test method in the class.
    [super tearDown];
}

- (void)testNullCallbackId
{
    CDVCommandDelegateImpl* impl = [[CDVCommandDelegateImpl alloc] initWithViewController:nil];

    NSString* callbackId = nil;

    XCTAssertFalse([impl isValidCallbackId:callbackId], @"A nil callbackId should be not valid");
}

@end
