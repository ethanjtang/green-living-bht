// Interests.tsx

'use client';

import { useState, useEffect } from 'react';
import Layout from "./layout";
import { SignOut } from "@/components/sign-out";
import TopicsList from "@/app/interests/topics";
import AuthNotFound from "@/db/sessionCheck";
import "@/styles/globals.css";
import * as dbUtils from "@/db/getUserAccount";

const sus_topics = ["Renewable Energy", "Sustainable Transportation", "Energy Efficiency", "Waste Reduction", "Water Conservation"];

export default function Interests() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/session');
        const data = await response.json();

        if (data.error) {
          setSession(null);
        } else {
          setSession(data.session);
        }
      } catch (error) {
        console.error('Error checking session', error);
        setSession(null);
      }
    };

    fetchSession();
  }, []);

  if (!session) {
    return (
      <div className="ml-[2vw]">
        <AuthNotFound />
      </div>
    );
  }

  const user_email = session.user?.email;

  return (
    <div className="home-page-bg ml-[2vh]">
      <h1 className="page-title">Interests Page</h1>
      <p className="page-caption">
        This is a placeholder for the interests page, where users will be able to select sustainability topics of interest.
      </p>
      <p className="page-caption">Hello, {user_email}!</p>
      <div>
        <SignOut />
      </div>
      <div>{user_email && <TopicsList userEmail={user_email} />}</div>
    </div>
  );
}
