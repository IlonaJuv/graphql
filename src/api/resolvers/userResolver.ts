import {GraphQLError} from 'graphql';
import {Cat} from '../../interfaces/Cat';
import LoginMessageResponse from '../../interfaces/LoginMessageResponse';
import {User, UserIdWithToken} from '../../interfaces/User';
import fetchData from '../../functions/fetchData';
import MessageResponse from '../../interfaces/MessageResponse';
import AuthMessageResponse from '../../interfaces/AuthMessageResponse';

// TODO: create resolvers based on user.graphql
// note: when updating or deleting a user don't send id to the auth server, it will get it from the token
// note2: when updating or deleting a user as admin, you need to check if the user is an admin by checking the role from the user object

const userResolvers = {
  Cat: {
    owner: async (parent: Cat) => {
      console.log(parent);
      const user = await fetchData<LoginMessageResponse>(
        `${process.env.AUTH_URL}/users/${parent.owner}`
      );
      return user;
    },
  },
  Query: {
    users: async () => {
      const users: User[] = await fetchData(`${process.env.AUTH_URL}/users`);
      console.log('userResolver users', users);
      return users;
    },
    userById: async (_parent: undefined, args: {id: string}) => {
      const user: User = await fetchData(
        `${process.env.AUTH_URL}/users/${args.id}`
      );
      return user;
    },
    checkToken: async (
      _parent: unknown,
      _args: unknown,
      user: UserIdWithToken
    ) => {
      // ehkä pitää tyypittää
      const response = await fetchData(`${process.env.AUTH_URL}/users/token`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      return response;
    },
  },
  Mutation: {
    login: async (
      _parent: undefined,
      args: {user_name: string; password: string}
    ) => {
      const options: RequestInit = {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(args),
      };
      const user: LoginMessageResponse = await fetchData(
        `${process.env.AUTH_URL}/auth/login`,
        options
      );
      console.log('login resolver user', user);
      return user;
    },
    register: async (_parent: undefined, args: {user: User}) => {
      console.log('register');
      const options: RequestInit = {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(args.user),
      };
      //Authmessageresponse
      const user: LoginMessageResponse = await fetchData(
        `${process.env.AUTH_URL}/users`,
        options
      );
      console.log('Register user', user);

      return user;
    },
    updateUser: async (
      _parent: undefined,
      args: {user: User},
      user: UserIdWithToken
    ) => {
      if (!user.token) {
        throw new GraphQLError('You are not authorized to perform this action');
      }
      const options: RequestInit = {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(args.user),
      };
      const response = await fetchData<LoginMessageResponse>(
        `${process.env.AUTH_URL}/users`,
        options
      );
      return response as LoginMessageResponse;
    },
    deleteUser: async (
      _parent: unknown,
      _args: unknown,
      user: UserIdWithToken
    ) => {
      if (!user.token) {
        throw new GraphQLError('Not authorized', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }

      const response = await fetchData<LoginMessageResponse>(
        `${process.env.AUTH_URL}/users`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      return response;
    },
    updateUserAsAdmin: async (
      _parent: undefined,
      args: User,
      user: UserIdWithToken
    ) => {
      if (!user.token || user.role !== 'admin') {
        throw new GraphQLError('You are not authorized to perform this action');
      }
      const options: RequestInit = {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
            role: user.role,
          },
          body: JSON.stringify(args),
        },
        response = await fetchData<LoginMessageResponse>(
          `${process.env.AUTH_URL}/users/${args.id}`,
          options
        );
      console.log('userresolver adminupdate', response);
      return response;
    },
    deleteUserAsAdmin: async (
      _parent: unknown,
      args: User,
      user: UserIdWithToken
    ) => {
      if (!user.token || user.role !== 'admin') {
        throw new GraphQLError('Not authorized', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }
      const response = await fetchData<LoginMessageResponse>(
        `${process.env.AUTH_URL}/users/` + args.id,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      return response;
    },
  },
};

export default userResolvers;


