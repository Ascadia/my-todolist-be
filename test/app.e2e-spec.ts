import * as pactum from 'pactum';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { SigninDto, SignupDto } from '../src/auth/dto';
import { EditUserDto } from '../src/user/dto';
import { CreateTaskDto, EditTaskDto } from '../src/task/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    // start the server
    await app.listen(3334);

    prisma = app.get(PrismaService);
    // pulisco il db..
    await prisma.cleanDb();

    pactum.request.setBaseUrl('http://localhost:3334');
  });

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    describe('Signup', () => {
      const dto: SignupDto = {
        email: 'matteo@fake.com',
        password: '123',
        userName: 'mattoMatteo',
      };
      it('should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            password: dto.password,
            userName: dto.userName,
          })
          .expectStatus(400);
      });
      it('should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: dto.email,
            userName: dto.userName,
          })
          .expectStatus(400);
      });
      it('should throw if userName empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: dto.email,
            password: dto.password,
          })
          .expectStatus(400);
      });
      it('should throw if no body provided', () => {
        return pactum.spec().post('/auth/signup').expectStatus(400);
      });
      it('should signup', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });
    });
    describe('Signin', () => {
      const dto: SigninDto = {
        email: 'matteo@fake.com',
        password: '123',
      };
      it('should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });
      it('should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400);
      });
      it('should throw if no body provided', () => {
        return pactum.spec().post('/auth/signin').expectStatus(400);
      });
      it('should signin', () => {
        return (
          pactum
            .spec()
            .post('/auth/signin')
            .withBody(dto)
            .expectStatus(200)
            // salva variabile nello store di pactum
            .stores('userAt', 'access_token')
        );
      });
    });
  });
  describe('User', () => {
    describe('Get me', () => {
      it('should get current user', () => {
        return (
          pactum
            .spec()
            .get('/users/me')
            // inietta la variabile pactum salvata precedentemente
            .withHeaders('Authorization', `Bearer $S{userAt}`)
            .expectStatus(200)
        );
      });
    });
    describe('Edit user', () => {
      it('should edit user', () => {
        const dto: EditUserDto = {
          userName: 'Matteooo',
          email: 'matteo2@fake.com',
        };

        return pactum
          .spec()
          .patch('/users')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.email)
          .expectBodyContains(dto.userName);
      });
    });
  });
  describe('Task', () => {
    describe('Get empty tasks', () => {
      it('should get tasks', () => {
        return pactum
          .spec()
          .get('/tasks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectBody([]);
      });
    });
    describe('Create task', () => {
      const dto: CreateTaskDto = {
        text: 'First task',
      };
      it('should create task', () => {
        return pactum
          .spec()
          .post('/tasks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(dto)
          .expectStatus(201)
          .stores('taskId', 'id');
      });
    });
    describe('Get task', () => {
      it('should get tasks', () => {
        return pactum
          .spec()
          .get('/tasks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectJsonLength(1);
      });
    });
    describe('Get task by id', () => {
      it('should get task by id', () => {
        return pactum
          .spec()
          .get('/tasks/{id}')
          .withPathParams('id', '$S{taskId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectBodyContains('$S{taskId}');
      });
    });
    describe('Edit task', () => {
      const dto: EditTaskDto = {
        isDone: true,
        text: 'test1',
      };
      it('should edit task', () => {
        return pactum
          .spec()
          .patch('/tasks/{id}')
          .withPathParams('id', '$S{taskId}')
          .withBody(dto)
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectBodyContains('$S{taskId}')
          .expectBodyContains(dto.text)
          .expectBodyContains(dto.isDone);
      });
    });
    describe('Delete task', () => {
      it('should delete task', () => {
        return pactum
          .spec()
          .delete('/tasks/{id}')
          .withPathParams('id', '$S{taskId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(204);
      });
      it('should get empty tasks', () => {
        return pactum
          .spec()
          .get('/tasks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectJsonLength(0);
      });
    });
  });
});
