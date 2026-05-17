import * as z from "zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Loader from "@/components/shared/Loader";
import { useToast } from "@/components/ui/use-toast";

import { SigninValidation } from "@/lib/validation";
import { useSignInAccount } from "@/lib/react-query/queriesAndMutations";
import { useUserContext } from "@/context/AuthContext";

const SigninForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { checkAuthUser, isLoading: isUserLoading } = useUserContext();
  const [showPassword, setShowPassword] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Query
  const { mutateAsync: signInAccount, isPending: isSigningIn } =
    useSignInAccount();

  const form = useForm<z.infer<typeof SigninValidation>>({
    resolver: zodResolver(SigninValidation),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const interval = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const getRetryAfterSeconds = (message?: string) => {
    if (!message) return null;

    const match = message.match(/after\s+(\d+)\s*(second|seconds|sec|secs|s)?/i);
    if (!match) return null;

    const seconds = Number(match[1]);
    return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
  };

  const handleSignin = async (user: z.infer<typeof SigninValidation>) => {
    if (cooldownSeconds > 0) {
      return toast({
        title: "Please wait",
        description: `Try again in ${cooldownSeconds}s.`,
      });
    }

    try {
      const session = await signInAccount(user);

      if (!session) {
        return toast({
          title: "Sign in failed",
          description:
            "No session was created. Verify email/password and try again.",
          variant: "destructive",
        });
      }

      const isLoggedIn = await checkAuthUser();

      if (isLoggedIn) {
        form.reset();
        navigate("/");
      } else {
        return toast({
          title: "Signed in, but profile load failed",
          description:
            "Session exists, but user profile could not be loaded from the database.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      const message =
        error?.message ||
        "Unable to sign in. Check your email/password and Appwrite auth settings.";

      if (
        error?.code === 429 ||
        /rate limit/i.test(message)
      ) {
        setCooldownSeconds(getRetryAfterSeconds(message) || 60);
      }

      return toast({
        title: "Sign in failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <div className="sm:w-420 flex-center flex-col">
        <img
          src="/assets/images/PhotoOp-1.svg"
          alt="logo"
          className=" w-[250px]"
        />

        <h2 className="h3-bold md:h2-bold pt-5 sm:pt-12">Account Sign in</h2>
        <p className="text-light-3 small-medium md:base-regular mt-2">
          Welcome back! Please enter your credentials.
        </p>
        <form
          onSubmit={form.handleSubmit(handleSignin)}
          className="flex flex-col gap-5 w-full mt-4"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form_label">Email</FormLabel>
                <FormControl>
                  <Input type="text" className="shad-input" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form_label">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      className="shad-input pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-light-3"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.79-1.88 2-3.55 3.51-4.9" />
                          <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8a11.01 11.01 0 0 1-4.11 5.94" />
                          <path d="M14.12 14.12a3 3 0 0 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="shad-button_primary"
            disabled={isSigningIn || isUserLoading || cooldownSeconds > 0}
          >
            {isSigningIn || isUserLoading ? (
              <div className="flex-center gap-2">
                <Loader /> Loading...
              </div>
            ) : cooldownSeconds > 0 ? (
              `Try again in ${cooldownSeconds}s`
            ) : (
              "Sign in"
            )}
          </Button>

          <p className="text-small-regular text-light-2 text-center mt-2">
            Don&apos;t have an account?
            <Link
              to="/sign-up"
              className="text-primary-500 text-small-semibold ml-1"
            >
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </Form>
  );
};

export default SigninForm;
