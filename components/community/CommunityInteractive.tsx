"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  createCommunityComment,
  createCommunityPost,
  createCommunityReport,
  softDeleteCommunityComment,
  softDeleteCommunityPost,
  toggleCommunityReaction,
  updateCommunityComment,
  updateCommunityPost,
} from "@/app/community/actions";
import {
  communityReactionTypes,
  initialCommunityActionState,
  type CommunityActionState,
  type CommunityCommentView,
  type CommunityPostView,
  type CommunityReactionSummary,
  type CommunityReactionType,
} from "@/lib/community/types";

const inputClassName = "mt-2 w-full border border-[#242721]/25 bg-[#f9f5ed] px-3.5 py-3 text-sm text-[#242721] outline-none transition-colors placeholder:text-[#777a70] focus:border-[#2d4737]";
const labelClassName = "text-sm font-semibold text-[#2d4737]";

const reactionLabels: Record<CommunityReactionType, string> = {
  like: "Like",
  helpful: "Useful",
  cheer: "Cheer",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function useRefreshOnSuccess(state: CommunityActionState) {
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);
}

function ActionFeedback({ state }: { state: CommunityActionState }) {
  if (state.status === "idle") {
    return null;
  }

  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={`mt-3 border px-3 py-2 text-sm leading-6 ${state.status === "error" ? "border-[#7b2430]/40 bg-[#f1dedd] text-[#7b2430]" : "border-[#2d4737]/30 bg-[#e5eee7] text-[#2d4737]"}`}
    >
      {state.message}
    </p>
  );
}

function ContentStatus({
  moderationStatus,
  deletedAt,
}: {
  moderationStatus: string;
  deletedAt: string | null;
}) {
  if (deletedAt) {
    return <p className="mt-4 border border-[#7b2430]/35 bg-[#f1dedd] px-3 py-2 text-sm leading-6 text-[#7b2430]">This entry has been deleted by its author and is no longer visible to other members.</p>;
  }

  if (moderationStatus === "hidden") {
    return <p className="mt-4 border border-[#b08d57]/45 bg-[#f8f0dc] px-3 py-2 text-sm leading-6 text-[#62543a]">This entry is hidden while it is reviewed. Only its author and community moderators can see it.</p>;
  }

  if (moderationStatus === "removed") {
    return <p className="mt-4 border border-[#7b2430]/35 bg-[#f1dedd] px-3 py-2 text-sm leading-6 text-[#7b2430]">This entry was removed from the member-facing conversation.</p>;
  }

  if (moderationStatus === "pending") {
    return <p className="mt-4 border border-[#b08d57]/45 bg-[#f8f0dc] px-3 py-2 text-sm leading-6 text-[#62543a]">This entry is waiting for review and is not visible to other members yet.</p>;
  }

  return null;
}

function ReactionButton({
  target,
  reactionType,
  reactions,
}: {
  target: { postId?: string; commentId?: string };
  reactionType: CommunityReactionType;
  reactions: CommunityReactionSummary;
}) {
  const [state, formAction, pending] = useActionState(toggleCommunityReaction, initialCommunityActionState);
  useRefreshOnSuccess(state);
  const isActive = reactions.viewerReactionTypes.includes(reactionType);
  const count = reactions.counts[reactionType];

  return (
    <div>
      <form action={formAction}>
        {target.postId ? <input type="hidden" name="postId" value={target.postId} /> : null}
        {target.commentId ? <input type="hidden" name="commentId" value={target.commentId} /> : null}
        <input type="hidden" name="reactionType" value={reactionType} />
        <button
          type="submit"
          disabled={pending}
          aria-pressed={isActive}
          className={`border px-2.5 py-1.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${isActive ? "border-[#2d4737] bg-[#2d4737] text-[#f9f4eb]" : "border-[#242721]/20 bg-[#f9f5ed] text-[#50564e] hover:border-[#7b2430] hover:text-[#7b2430]"}`}
        >
          {reactionLabels[reactionType]}{count > 0 ? ` ${count}` : ""}
        </button>
      </form>
      <ActionFeedback state={state} />
    </div>
  );
}

function ReactionControls({
  target,
  reactions,
}: {
  target: { postId?: string; commentId?: string };
  reactions: CommunityReactionSummary;
}) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Reactions">
      {communityReactionTypes.map((reactionType) => (
        <ReactionButton key={reactionType} target={target} reactionType={reactionType} reactions={reactions} />
      ))}
    </div>
  );
}

function ReportAction({ target }: { target: { postId?: string; commentId?: string } }) {
  const [state, formAction, pending] = useActionState(createCommunityReport, initialCommunityActionState);
  useRefreshOnSuccess(state);

  return (
    <details className="relative">
      <summary className="cursor-pointer text-xs font-semibold text-[#686a61] transition-colors hover:text-[#7b2430]">Report</summary>
      <form action={formAction} className="mt-3 w-full border border-[#242721]/20 bg-[#f9f5ed] p-4 sm:w-80">
        {target.postId ? <input type="hidden" name="postId" value={target.postId} /> : null}
        {target.commentId ? <input type="hidden" name="commentId" value={target.commentId} /> : null}
        <label className={labelClassName}>
          Reason
          <select name="reason" required defaultValue="" className={inputClassName}>
            <option value="" disabled>Choose one</option>
            <option value="spam">Spam</option>
            <option value="harassment">Harassment</option>
            <option value="misinformation">Misinformation</option>
            <option value="safety">Safety concern</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className={`mt-4 block ${labelClassName}`}>
          A little more context <span className="font-normal text-[#686a61]">(optional)</span>
          <textarea name="details" maxLength={2000} rows={3} className={inputClassName} />
        </label>
        <button type="submit" disabled={pending} className="mt-4 border border-[#7b2430] px-3 py-2 text-xs font-bold text-[#7b2430] transition-colors hover:bg-[#7b2430] hover:text-[#f9f4eb] disabled:cursor-not-allowed disabled:opacity-70">
          {pending ? "Sending…" : "Send report"}
        </button>
        <ActionFeedback state={state} />
      </form>
    </details>
  );
}

function PostAuthorActions({ post }: { post: CommunityPostView }) {
  const [editState, editAction, editing] = useActionState(updateCommunityPost, initialCommunityActionState);
  const [deleteState, deleteAction, deleting] = useActionState(softDeleteCommunityPost, initialCommunityActionState);
  useRefreshOnSuccess(editState);
  useRefreshOnSuccess(deleteState);

  if (post.deleted_at) {
    return null;
  }

  return (
    <details>
      <summary className="cursor-pointer text-xs font-semibold text-[#686a61] transition-colors hover:text-[#7b2430]">Edit or remove</summary>
      <div className="mt-3 border border-[#242721]/20 bg-[#f9f5ed] p-4">
        <form action={editAction}>
          <input type="hidden" name="postId" value={post.id} />
          <label className={labelClassName}>Title<input name="title" required minLength={1} maxLength={240} defaultValue={post.title} className={inputClassName} /></label>
          <label className={`mt-4 block ${labelClassName}`}>Note<textarea name="body" required minLength={1} maxLength={20000} rows={7} defaultValue={post.body} className={inputClassName} /></label>
          <button type="submit" disabled={editing} className="mt-4 border border-[#2d4737] bg-[#2d4737] px-3 py-2 text-xs font-bold text-[#f9f4eb] transition-colors hover:bg-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70">{editing ? "Saving…" : "Save changes"}</button>
          <ActionFeedback state={editState} />
        </form>
        <form action={deleteAction} className="mt-4 border-t border-[#242721]/15 pt-4">
          <input type="hidden" name="postId" value={post.id} />
          <button type="submit" disabled={deleting} className="text-xs font-bold text-[#7b2430] underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-70">{deleting ? "Removing…" : "Soft-delete this note"}</button>
          <ActionFeedback state={deleteState} />
        </form>
      </div>
    </details>
  );
}

function CommentAuthorActions({ comment }: { comment: CommunityCommentView }) {
  const [editState, editAction, editing] = useActionState(updateCommunityComment, initialCommunityActionState);
  const [deleteState, deleteAction, deleting] = useActionState(softDeleteCommunityComment, initialCommunityActionState);
  useRefreshOnSuccess(editState);
  useRefreshOnSuccess(deleteState);

  if (comment.deleted_at) {
    return null;
  }

  return (
    <details>
      <summary className="cursor-pointer text-xs font-semibold text-[#686a61] transition-colors hover:text-[#7b2430]">Edit or remove</summary>
      <div className="mt-3 border border-[#242721]/20 bg-[#f9f5ed] p-4">
        <form action={editAction}>
          <input type="hidden" name="commentId" value={comment.id} />
          <label className={labelClassName}>Comment<textarea name="body" required minLength={1} maxLength={10000} rows={5} defaultValue={comment.body} className={inputClassName} /></label>
          <button type="submit" disabled={editing} className="mt-4 border border-[#2d4737] bg-[#2d4737] px-3 py-2 text-xs font-bold text-[#f9f4eb] transition-colors hover:bg-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70">{editing ? "Saving…" : "Save changes"}</button>
          <ActionFeedback state={editState} />
        </form>
        <form action={deleteAction} className="mt-4 border-t border-[#242721]/15 pt-4">
          <input type="hidden" name="commentId" value={comment.id} />
          <button type="submit" disabled={deleting} className="text-xs font-bold text-[#7b2430] underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-70">{deleting ? "Removing…" : "Soft-delete this comment"}</button>
          <ActionFeedback state={deleteState} />
        </form>
      </div>
    </details>
  );
}

export function CommunityPostComposer({ spaceId }: { spaceId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createCommunityPost, initialCommunityActionState);
  useRefreshOnSuccess(state);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <section className="border border-[#242721]/20 bg-[#e7e1d5] p-5 sm:p-7" aria-labelledby="new-note-title">
      <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">Start a note</p>
      <h2 id="new-note-title" className="mt-2 font-serif text-3xl tracking-[-0.025em] text-[#242721]">What is worth passing down the aisle?</h2>
      <form ref={formRef} action={formAction} className="mt-6">
        <input type="hidden" name="spaceId" value={spaceId} />
        <label className={labelClassName}>A clear title<input name="title" required minLength={1} maxLength={240} placeholder="The part everyone should know" className={inputClassName} /></label>
        <label className={`mt-4 block ${labelClassName}`}>Your note<textarea name="body" required minLength={1} maxLength={20000} rows={7} placeholder="Share the useful context, not just the headline." className={inputClassName} /></label>
        <div className="mt-4 flex flex-col gap-3 border-t border-[#242721]/15 pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-xl text-xs leading-5 text-[#686a61]">Posts are published for active members and stay editable by their author. Keep it useful, kind, and specific.</p><button type="submit" disabled={pending} className="shrink-0 border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#f9f4eb] transition-colors hover:bg-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70">{pending ? "Posting…" : "Post note"}</button></div>
        <ActionFeedback state={state} />
      </form>
    </section>
  );
}

export function CommunityPostCard({
  post,
  viewerId,
  detailHref,
  fullBody = false,
}: {
  post: CommunityPostView;
  viewerId: string;
  detailHref?: string;
  fullBody?: boolean;
}) {
  const isAuthor = post.author_id === viewerId;
  const isVisible = post.moderation_status === "published" && !post.deleted_at;

  return (
    <article className="border border-[#242721]/20 bg-[#f9f5ed] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 text-xs text-[#686a61]"><p><span className="font-bold text-[#2d4737]">{post.authorName}</span> · {formatDate(post.created_at)}{post.edited_at ? " · edited" : ""}</p>{post.is_pinned ? <span className="border border-[#b08d57] px-2 py-1 font-bold uppercase tracking-[0.12em] text-[#7b2430]">Pinned</span> : null}</div>
      <ContentStatus moderationStatus={post.moderation_status} deletedAt={post.deleted_at} />
      {detailHref ? <Link href={detailHref} className="mt-5 block w-fit font-serif text-3xl leading-tight tracking-[-0.03em] text-[#242721] transition-colors hover:text-[#7b2430]">{post.title}</Link> : <h1 className="mt-5 font-serif text-4xl leading-tight tracking-[-0.035em] text-[#242721] sm:text-5xl">{post.title}</h1>}
      <p className={`mt-4 whitespace-pre-wrap text-sm leading-7 text-[#50564e] sm:text-base ${fullBody ? "" : "line-clamp-4"}`}>{post.body}</p>
      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-[#242721]/15 pt-4"><span className="text-xs font-semibold text-[#686a61]">{post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}</span>{isVisible ? <ReactionControls target={{ postId: post.id }} reactions={post.reactions} /> : null}<div className="ml-auto flex items-center gap-4">{isVisible ? <ReportAction target={{ postId: post.id }} /> : null}{isAuthor ? <PostAuthorActions post={post} /> : null}</div></div>
      {detailHref ? <Link href={detailHref} className="mt-5 inline-flex border-b border-[#2d4737] pb-1 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430]">Open the full conversation <span className="ml-2" aria-hidden="true">↗</span></Link> : null}
    </article>
  );
}

function CommunityCommentComposer({ postId }: { postId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createCommunityComment, initialCommunityActionState);
  useRefreshOnSuccess(state);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form ref={formRef} action={formAction} className="border border-[#242721]/20 bg-[#e7e1d5] p-5">
      <input type="hidden" name="postId" value={postId} />
      <label className={labelClassName}>Add your perspective<textarea name="body" required minLength={1} maxLength={10000} rows={5} placeholder="The useful part you would tell someone by the gate." className={inputClassName} /></label>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs leading-5 text-[#686a61]">Comments stay in one chronological thread for now—no deep reply chains.</p><button type="submit" disabled={pending} className="border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#f9f4eb] transition-colors hover:bg-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70">{pending ? "Adding…" : "Add comment"}</button></div>
      <ActionFeedback state={state} />
    </form>
  );
}

function CommunityCommentCard({ comment, viewerId }: { comment: CommunityCommentView; viewerId: string }) {
  const isAuthor = comment.author_id === viewerId;
  const isVisible = comment.moderation_status === "published" && !comment.deleted_at;

  return (
    <article className="border-b border-[#242721]/15 py-5 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-3"><p className="text-xs text-[#686a61]"><span className="font-bold text-[#2d4737]">{comment.authorName}</span> · {formatDate(comment.created_at)}{comment.edited_at ? " · edited" : ""}</p><div className="flex items-center gap-4">{isVisible ? <ReportAction target={{ commentId: comment.id }} /> : null}{isAuthor ? <CommentAuthorActions comment={comment} /> : null}</div></div>
      <ContentStatus moderationStatus={comment.moderation_status} deletedAt={comment.deleted_at} />
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#50564e]">{comment.body}</p>
      {isVisible ? <div className="mt-4"><ReactionControls target={{ commentId: comment.id }} reactions={comment.reactions} /></div> : null}
    </article>
  );
}

export function CommunityCommentThread({
  postId,
  comments,
  viewerId,
  canComment,
}: {
  postId: string;
  comments: CommunityCommentView[];
  viewerId: string;
  canComment: boolean;
}) {
  return (
    <section className="mt-10" aria-labelledby="comments-title">
      <div className="flex items-end justify-between gap-4 border-b border-[#242721]/20 pb-4"><div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-[#7b2430]">From the rail</p><h2 id="comments-title" className="mt-2 font-serif text-3xl tracking-[-0.03em] text-[#242721]">The conversation</h2></div><p className="text-sm font-semibold text-[#686a61]">{comments.length} {comments.length === 1 ? "comment" : "comments"}</p></div>
      <div className="mt-6">{canComment ? <CommunityCommentComposer postId={postId} /> : <p className="border border-[#b08d57]/45 bg-[#f8f0dc] px-4 py-3 text-sm leading-6 text-[#62543a]">This note is no longer open for new comments.</p>}</div>
      {comments.length > 0 ? <div className="mt-7 border border-[#242721]/20 bg-[#f9f5ed] p-5 sm:p-6">{comments.map((comment) => <CommunityCommentCard key={comment.id} comment={comment} viewerId={viewerId} />)}</div> : <p className="mt-7 border border-dashed border-[#2d4737]/40 bg-[#edf1f0] p-5 text-sm leading-6 text-[#56584f]">No comments yet. The first useful reply usually makes the whole thread better.</p>}
    </section>
  );
}
