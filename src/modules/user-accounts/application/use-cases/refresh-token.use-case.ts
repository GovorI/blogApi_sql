import { CommandHandler } from '@nestjs/cqrs';
import { UnauthorizedException as DomainUnauthorizedException } from '../../../../core/domain';
import { JwtService } from '../jwt-service';
import { JwtConfig } from '../../../jwt/jwt.config';
import { SessionsSqlRepository } from '../../infrastructure/sessions.sql-repository';

export class RefreshTokenCommand {
  constructor(public refreshToken: string) {}
}

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenUseCase {
  constructor(
    private readonly jwtService: JwtService,
    private readonly jwtConfig: JwtConfig,
    private readonly sessionsRepository: SessionsSqlRepository,
  ) {}

  async execute(command: RefreshTokenCommand) {
    try {
      const payload = await this.jwtService.verifyToken(command.refreshToken);
      if (!payload.sub || !payload.jti || !payload.deviceId) {
        throw new DomainUnauthorizedException();
      }

      const userId = payload.sub;
      const sessionId = payload?.jti;
      const deviceId = payload.deviceId;

      const session = await this.sessionsRepository.findSessionById(sessionId);
      if (!session) {
        throw new DomainUnauthorizedException('Session not found');
      }

      if (session.iat.getTime() !== payload.iat * 1000) {
        throw new DomainUnauthorizedException('Invalid refresh token');
      }
      const { token: newAccessToken } = this.jwtService.createJwtToken(
        userId,
        deviceId,
        this.jwtConfig.accessTokenExpiresIn,
        false,
      );

      const { token: newRefreshToken, payload: newRefreshPayload } =
        this.jwtService.createJwtToken(
          userId,
          deviceId,
          this.jwtConfig.refreshTokenExpiresIn,
          true,
          sessionId,
        );

      if (!newRefreshPayload.iat || !newRefreshPayload.exp)
        throw new Error('Failed to generate new refresh token payload.');

      session.updateDates(newRefreshPayload.iat, newRefreshPayload.exp);
      await this.sessionsRepository.save(session);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      console.log(error);
      throw new DomainUnauthorizedException();
    }
  }
}
