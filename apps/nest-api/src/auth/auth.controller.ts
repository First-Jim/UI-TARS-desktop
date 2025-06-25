import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  Query,
  HttpCode,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { TokenResponseDto } from './dto/token-response.dto';
import { Throttle } from '@nestjs/throttler';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  VerifyTwoFactorDto,
  TwoFactorLoginDto,
  EnableTwoFactorDto,
} from './dto/two-factor.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'Returns tokens and user info (verified user)',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Email not verified (but returns tokens and user data)',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() loginDto: LoginDto, @Res() res): Promise<any> {
    const result = await this.authService.login(loginDto);

    // 检查是否是 2FA 情况
    if ('requiresTwoFactor' in result) {
      return res.status(200).json({
        code: 0,
        message: 'Two-factor authentication required',
        data: result,
      });
    }

    // 检查用户是否已验证邮箱
    const user = result.user;
    // if (!user.isVerified) {
    //   // 未验证用户返回 403 但包含完整的登录数据
    //   return res.status(403).json({
    //     code: 403,
    //     message: '邮箱未验证，请先验证邮箱后再使用完整功能',
    //     data: result // 包含 tokens 和用户信息
    //   });
    // }

    // 已验证用户正常返回
    return res.status(200).json({
      code: 0,
      message: 'Login successful',
      data: result,
    });
  }

  @Post('signup')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async signup(
    @Body() createUserDto: CreateUserDto,
  ): Promise<TokenResponseDto> {
    return this.authService.signup(createUserDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Returns new tokens',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @ApiBody({ schema: { properties: { refresh_token: { type: 'string' } } } })
  async refresh(
    @Body('refresh_token') token: string,
  ): Promise<TokenResponseDto> {
    return this.authService.refreshToken(token);
  }

  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiBody({ schema: { properties: { all_devices: { type: 'boolean' } } } })
  async logout(
    @Request() req,
    @Body('all_devices') allDevices: boolean = false,
  ) {
    return this.authService.logout(req.user.id, allDevices);
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify user email' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 404, description: 'Invalid verification token' })
  @ApiQuery({ name: 'token', required: true })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBody({ schema: { properties: { email: { type: 'string' } } } })
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  async resendVerification(@Body() body: { email: string }) {
    console.log('📧 Resend verification request body:', body);

    if (!body.email) {
      throw new BadRequestException('Email is required');
    }

    return this.authService.resendVerificationEmail(body.email);
  }

  @Get('profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 允许每分钟 30 次请求
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns the user profile (verified user)',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Not logged in' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Email not verified (but returns user data)',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getProfile(@Request() req, @Res() res) {
    const user = await this.usersService.findOne(req.user.id);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // 如果邮箱未验证，返回 403 但包含用户数据
    if (!user.isVerified) {
      return res.status(403).json({
        code: 403,
        message: '邮箱未验证，请先验证邮箱',
        data: user, // 包含用户信息，让前端可以显示和操作
      });
    }

    // 邮箱已验证，正常返回
    return res.status(200).json({
      code: 0,
      message: 'success',
      data: user,
    });
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({
    status: 200,
    description: 'Reset email sent if account exists',
  })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );
  }

  @Post('2fa/generate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Generate 2FA secret and QR code' })
  @ApiResponse({ status: 200, description: 'Returns 2FA setup information' })
  async generateTwoFactor(@Request() req) {
    return this.authService.generateTwoFactorSecret(req.user.id);
  }

  @Post('2fa/verify')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify and enable 2FA' })
  @ApiResponse({ status: 200, description: '2FA enabled successfully' })
  @ApiResponse({ status: 401, description: 'Invalid verification code' })
  async verifyAndEnableTwoFactor(
    @Request() req,
    @Body() verifyDto: VerifyTwoFactorDto,
  ) {
    return this.authService.verifyAndEnableTwoFactor(
      req.user.id,
      verifyDto.code,
    );
  }

  @Post('2fa/disable')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Disable 2FA' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  @ApiResponse({ status: 401, description: 'Password verification failed' })
  async disableTwoFactor(
    @Request() req,
    @Body() disableDto: EnableTwoFactorDto,
  ) {
    return this.authService.disableTwoFactor(req.user.id, disableDto.password);
  }

  @Post('2fa/authenticate')
  @ApiOperation({ summary: 'Complete login with 2FA code' })
  @ApiResponse({ status: 200, description: 'Returns authentication tokens' })
  @ApiResponse({
    status: 401,
    description: 'Invalid 2FA code or expired token',
  })
  async twoFactorAuth(@Body() twoFactorDto: TwoFactorLoginDto) {
    return this.authService.verifyTwoFactorAndLogin(twoFactorDto);
  }

  @Get('csrf-token')
  @ApiOperation({ summary: 'Get a CSRF token' })
  getCsrfToken(@Request() req) {
    return { csrfToken: req.csrfToken() };
  }
}
