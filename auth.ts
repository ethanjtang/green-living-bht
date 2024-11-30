import NextAuth from "next-auth"

import Credentials from "next-auth/providers/credentials"
import { ZodError } from "zod"
import { signInSchema } from "./lib/zod"

import Nodemailer from "next-auth/providers/nodemailer"
 
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/db/prisma";

import { saltAndHashPassword } from '@/db/authUtil';
import bcrypt from "bcrypt";

// For Microsoft Edge compatibility issues
import authConfig from "./auth.config"
 
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      credentials: {
        email: {type: 'text', label: 'Email', placeholder: 'Enter your email'},
        password: {type: 'password', label: 'Password', placeholder: 'Enter your password'},
      },
      
      authorize: async (credentials) => {
        let user = null

        if (!credentials) { 
          throw new Error("Email and password are required."); 
        }

        if (typeof credentials.email !== 'string' || 
            typeof credentials.password !== 'string') {
          throw new Error("Invalid type provided for input(s)."); 
        }

        console.log('entering try loop');

        try { 
          const { email, password } = await signInSchema.parseAsync(credentials)
          
          console.log('Checking if user exists');
          // logic to verify if the user exists
          user = await getUser(email)
          
          if (user)
          {
            console.log('User exists in db, comparing hashed password to input text');

            if (user.hashPassword != null)
            {
              console.log("hashed password: ", user.hashPassword);
              const isValidPassword = await bcrypt.compare(password, user.hashPassword);
              if (isValidPassword) {
                console.log('password matches, returning user object');
                // Return the user object if the password is valid
                return user;
              }
            }
          }

          if (!user) {
            console.log('user not found in db');
            // logic to salt and hash password
            
            const hashPassword = await saltAndHashPassword(credentials.password)
            // Create the new user
            const newUser = await prisma.user.create({
              data: { email, hashPassword },
            });
            console.log('New user created');
            user = await getUser(credentials.email);
            return user
          }
        }
        catch (error) {
          if (error instanceof ZodError) {
            // Return `null` to indicate that the credentials are invalid
            return null
          }
        }
        finally {
          return user
        }
      },
    }),
    Nodemailer({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
})

async function getUser(input_email: string) {
  let dbUser = null
  try
  {
    console.log('trying to find user in db with email: ', input_email);
    dbUser = await prisma.user.findUnique({
      where: {
        email: input_email,
      },
    });
  
    if (dbUser) 
    {
      console.log('user found in db lelole');
    }
  }  
  catch (error) 
  { 
    console.error("Error fetching user:", error); 
  }
  finally {
    return dbUser;
  }
}
