import { Module } from '@nestjs/common';
import { TypeOrmModule, type TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';

const getEnv = (name: string, fallbackName: string, defaultValue: string) =>
  process.env[name] ?? process.env[fallbackName] ?? defaultValue;

const getDatabaseName = () =>
  process.env.DB_DATABASE ??
  process.env.DB_NAME ??
  process.env.MYSQLDATABASE ??
  'pos_mini_cafe';

const getDatabaseUser = () =>
  process.env.DB_USERNAME ??
  process.env.DB_USER ??
  process.env.MYSQLUSER ??
  'root';

const getDatabasePassword = () =>
  process.env.DB_PASSWORD ??
  process.env.DB_PASS ??
  process.env.MYSQLPASSWORD ??
  '';

const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: getEnv('DB_HOST', 'MYSQLHOST', '127.0.0.1'),
  port: Number(getEnv('DB_PORT', 'MYSQLPORT', '3307')),
  username: getDatabaseUser(),
  password: getDatabasePassword(),
  database: getDatabaseName(),
  autoLoadEntities: true,
  synchronize: process.env.TYPEORM_SYNCHRONIZE !== 'false',
};

@Module({
  imports: [TypeOrmModule.forRoot(typeOrmConfig), UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
