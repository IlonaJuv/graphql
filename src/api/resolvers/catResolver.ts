import {GraphQLError} from 'graphql';
import {Cat} from '../../interfaces/Cat';
import {locationInput} from '../../interfaces/Location';
import {UserIdWithToken} from '../../interfaces/User';
import rectangleBounds from '../../utils/rectangleBounds';
import catModel from '../models/catModel';

// TODO: create resolvers based on cat.graphql
// note: when updating or deleting a cat, you need to check if the user is the owner of the cat
// note2: when updating or deleting a cat as admin, you need to check if the user is an admin by checking the role from the user object

const catResolver = {
  Query: {
    cats: async () => {
      const cats = await catModel.find();
      console.log('cats', cats);
      return cats;
    },
    catById: async (_parent: undefined, args: {id: string}) => {
      console.log('catById', args.id);
      return await catModel.findById(args.id);
    },
    catsByOwner: async (_parent: unknown, args: UserIdWithToken) => {
      const cats = await catModel.find({owner: args.id});
      console.log('cats', cats);
      return cats;
    },
    catsByArea: async (_parent: undefined, args: locationInput) => {
      const bounds = rectangleBounds(args.topRight, args.bottomLeft);
      return await catModel.find({
        location: {
          $geoWithin: {
            $geometry: bounds,
          },
        },
      });
    },
  },
  Mutation: {
    createCat: async (_parent: undefined, args: Cat, user: UserIdWithToken) => {
      console.log('createcat userinfo', user.id, user.token, user.role);
      if (!user.id) {
        throw new GraphQLError('Not authorized', {
          extensions: {code: 'UNAUTHORIZED'},
        });
      }
      args.owner = user.id;
      const newCat = new catModel(args);
      return await newCat.save();
    },
    updateCat: async (_parent: undefined, args: Cat, user: UserIdWithToken) => {
      const cat: Cat = (await catModel.findById(args.id)) as Cat;

      if (!user.token || cat.owner.toString() !== user.id) {
        throw new GraphQLError('Not authorized', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }
      return await catModel.findByIdAndUpdate(args.id, args, {new: true});
    },
    deleteCat: async (
      _parent: undefined,
      args: {id: string},
      user: UserIdWithToken
    ) => {
      const cat: Cat = (await catModel.findById(args.id)) as Cat;

      if (!user.token || cat.owner.toString() !== user.id) {
        throw new GraphQLError('Not authorized', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }
      return await catModel.findByIdAndDelete(args.id);
    },
    updateCatAsAdmin: async (
      _parent: undefined,
      args: Cat,
      user: UserIdWithToken
    ) => {
      if (!user.token || user.role !== 'admin') {
        throw new GraphQLError('Not authorized', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }
      return await catModel.findByIdAndUpdate(args.id, args, {
        new: true,
      });
    },
    deleteCatAsAdmin: async (
      _parent: undefined,
      args: {id: string},
      user: UserIdWithToken
    ) => {
      if (!user.token || user.role !== 'admin') {
        throw new GraphQLError('Not authorized', {
          extensions: {code: 'UNAUTHORIZED'},
        });
      }
      return await catModel.findByIdAndDelete(args.id);
    },
  },
};

export default catResolver;
