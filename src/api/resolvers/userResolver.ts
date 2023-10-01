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

/*
import {GraphQLError} from 'graphql';
import {Cat} from '../../interfaces/Cat';
import LoginMessageResponse from '../../interfaces/LoginMessageResponse';
import {User, UserIdWithToken} from '../../interfaces/User';

import dotenv from 'dotenv';
const crypto = require('crypto');
dotenv.config();

// TODO: create resolvers based on user.graphql
// note: when updating or deleting a user don't send id to the auth server, it will get it from the token
// note2: when updating or deleting a user as admin, you need to check if the user is an admin by checking the role from the user object

export default {
  Cat: {
    owner: async (parent: Cat) => {
      const response = await fetch(
        `${process.env.AUTH_URL}/users/${parent.owner}`
      );
      if (!response.ok) {
        throw new GraphQLError(response.statusText, {
          extensions: {code: 'NOT_FOUND'},
        });
      }
      const user = (await response.json()) as User;
      return user;
    },
  },
  Query: {
    users: async () => {
      const response = await fetch(`${process.env.AUTH_URL}/users`);
      if (!response.ok) {
        throw new GraphQLError(response.statusText, {
          extensions: {code: 'NOT_FOUND'},
        });
      }
      const users = (await response.json()) as User[];
      return users;
    },
    userById: async (_parent: unknown, args: {id: string}) => {
      const response = await fetch(`${process.env.AUTH_URL}/users/${args.id}`);

      if (!response.ok) {
        throw new GraphQLError(response.statusText, {
          extensions: {code: 'NOT_FOUND'},
        });
      }
      const user = (await response.json()) as User;
      return user;
    },
    checkToken: async (
      _parent: unknown,
      _args: unknown,
      user: UserIdWithToken
    ) => {
      const response = await fetch(`${process.env.AUTH_URL}/users/token`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        throw new GraphQLError(response.statusText, {
          extensions: {code: 'NOT_FOUND'},
        });
      }
      const userFromAuth = await response.json();
      return userFromAuth;
    },
  },
  Mutation: {
    login: async (
      _parent: unknown,
      args: {credentials: {username: string; password: string}}
    ) => {
      const response = await fetch(`${process.env.AUTH_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(args.credentials),
      });

      if (!response.ok) {
        throw new GraphQLError(response.statusText, {
          extensions: {code: 'NOT_FOUND'},
        });
      }
      const user = (await response.json()) as LoginMessageResponse;
      return user;
    },
    register: async (_parent: unknown, args: {user: User}) => {
      const response = await fetch(`${process.env.AUTH_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(args.user),
      });

      if (!response.ok) {
        throw new GraphQLError(response.statusText, {
          extensions: {code: 'VALIDATION_ERROR'},
        });
      }
      const user = (await response.json()) as LoginMessageResponse;
      return user;
    },
    updateUser: async (
      _parent: unknown,
      args: {user: User},
      user: UserIdWithToken
    ) => {
      if (!user.token) return null;
      const response = await fetch(`${process.env.AUTH_URL}/users`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(args.user),
      });
      if (!response.ok) {
        throw new GraphQLError(response.statusText, {
          extensions: {code: 'NOT_FOUND'},
        });
      }
      const userFromPut = (await response.json()) as LoginMessageResponse;
      return userFromPut;
    },
    deleteUser: async (
      _parent: unknown,
      _args: unknown,
      user: UserIdWithToken
    ) => {
      if (!user.token) return null;
      const response = await fetch(`${process.env.AUTH_URL}/users`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (!response.ok) {
        throw new GraphQLError(response.statusText, {
          extensions: {code: 'NOT_FOUND'},
        });
      }
      const userFromDelete = (await response.json()) as LoginMessageResponse;
      return userFromDelete;
    },
    deleteUserAsAdmin: async (
      _parent: unknown,
      args: User,
      user: UserIdWithToken
    ) => {
      // note2: when updating or deleting a user as admin, you need to check if the user is an admin by checking the role from the user object
      if (!user.token || !user.role.includes('admin')) return null;
      const res = await fetch(`${process.env.AUTH_URL}/users/${args.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
          role: user.role, //add role from user object
        },
      });

      const userDeleted = (await res.json()) as LoginMessageResponse;
      return userDeleted;
    },

    updateUserAsAdmin: async (
      _parent: unknown,
      args: User,
      user: UserIdWithToken
    ) => {
      if (!user.token || !user.role.includes('admin')) return null;
      const response = await fetch(`${process.env.AUTH_URL}/users/${args.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
          role: user.role, //add role from user object
        },
        body: JSON.stringify(args),
      });

      const userUpdated = (await response.json()) as LoginMessageResponse;
      return userUpdated;
    },
  },
};
*/
