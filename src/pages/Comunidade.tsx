import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Send, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Profile {
  display_name: string;
  avatar_url?: string;
}

interface Post {
  id: string;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  profiles: Profile;
  is_liked?: boolean;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: Profile;
}

export default function Comunidade() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          profiles:user_id (display_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Check if user liked each post
      if (user && data) {
        const postsWithLikes = await Promise.all(
          data.map(async (post) => {
            const { data: like } = await supabase
              .from('community_post_likes')
              .select('id')
              .eq('user_id', user.id)
              .eq('post_id', post.id)
              .single();

            return { ...post, is_liked: !!like };
          })
        );
        setPosts(postsWithLikes);
      } else {
        setPosts(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar posts:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar posts da comunidade.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createPost = async () => {
    if (!user || !newPostContent.trim()) return;

    try {
      const { error } = await supabase
        .from('community_posts')
        .insert({
          content: newPostContent.trim(),
          user_id: user.id
        });

      if (error) throw error;

      setNewPostContent("");
      fetchPosts();
      toast({
        title: "Sucesso!",
        description: "Post criado com sucesso."
      });
    } catch (error) {
      console.error('Erro ao criar post:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar post.",
        variant: "destructive"
      });
    }
  };

  const toggleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return;

    try {
      if (isLiked) {
        await supabase
          .from('community_post_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
      } else {
        await supabase
          .from('community_post_likes')
          .insert({
            user_id: user.id,
            post_id: postId
          });
      }

      fetchPosts();
    } catch (error) {
      console.error('Erro ao curtir post:', error);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('community_comments')
        .select(`
          *,
          profiles:user_id (display_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
    }
  };

  const addComment = async (postId: string) => {
    if (!user || !newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('community_comments')
        .insert({
          content: newComment.trim(),
          post_id: postId,
          user_id: user.id
        });

      if (error) throw error;

      setNewComment("");
      fetchComments(postId);
      fetchPosts(); // Refresh to update comment count
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
    }
  };

  const getUserInitials = (name: string) => {
    return name ? name.slice(0, 2).toUpperCase() : "U";
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Carregando comunidade...</h1>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Comunidade</h1>
            <p className="text-muted-foreground">
              Conecte-se com outros usuários, compartilhe experiências e aprenda juntos.
            </p>
          </div>

          {/* Create Post */}
          {user && (
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar>
                    {userProfile?.avatar_url ? (
                      <AvatarImage src={userProfile.avatar_url} alt="Avatar" />
                    ) : (
                      <AvatarFallback>
                        {getUserInitials(userProfile?.display_name || user.email || "")}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-medium">{userProfile?.display_name || user.email}</p>
                    <p className="text-sm text-muted-foreground">O que você está pensando?</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Compartilhe algo com a comunidade..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="min-h-20 mb-4"
                />
                <div className="flex justify-between items-center">
                  <Button variant="outline" size="sm">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Adicionar imagem
                  </Button>
                  <Button 
                    onClick={createPost}
                    disabled={!newPostContent.trim()}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Publicar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Posts */}
          {posts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground mb-4">Nenhum post na comunidade ainda.</p>
                <p className="text-sm text-muted-foreground">Seja o primeiro a compartilhar algo!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <Card key={post.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        {post.profiles?.avatar_url ? (
                          <AvatarImage src={post.profiles.avatar_url} alt="Avatar" />
                        ) : (
                          <AvatarFallback>
                            {getUserInitials(post.profiles?.display_name || "")}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="font-medium">{post.profiles?.display_name || "Usuário"}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(post.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">{post.content}</p>
                    
                    {post.image_url && (
                      <div className="mb-4">
                        <img 
                          src={post.image_url} 
                          alt="Post image"
                          className="rounded-lg max-w-full h-auto"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-4 pt-4 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleLike(post.id, post.is_liked || false)}
                        className={post.is_liked ? "text-red-500" : ""}
                        disabled={!user}
                      >
                        <Heart className={`h-4 w-4 mr-1 ${post.is_liked ? "fill-current" : ""}`} />
                        {post.likes_count}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (selectedPost === post.id) {
                            setSelectedPost(null);
                          } else {
                            setSelectedPost(post.id);
                            fetchComments(post.id);
                          }
                        }}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {post.comments_count}
                      </Button>
                    </div>

                    {/* Comments Section */}
                    {selectedPost === post.id && (
                      <div className="mt-4 pt-4 border-t space-y-4">
                        {comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              {comment.profiles?.avatar_url ? (
                                <AvatarImage src={comment.profiles.avatar_url} alt="Avatar" />
                              ) : (
                                <AvatarFallback className="text-xs">
                                  {getUserInitials(comment.profiles?.display_name || "")}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-muted rounded-lg p-3">
                                <p className="font-medium text-sm">{comment.profiles?.display_name || "Usuário"}</p>
                                <p className="text-sm">{comment.content}</p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(comment.created_at), { 
                                  addSuffix: true, 
                                  locale: ptBR 
                                })}
                              </p>
                            </div>
                          </div>
                        ))}

                        {user && (
                          <div className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              {userProfile?.avatar_url ? (
                                <AvatarImage src={userProfile.avatar_url} alt="Avatar" />
                              ) : (
                                <AvatarFallback className="text-xs">
                                  {getUserInitials(userProfile?.display_name || user.email || "")}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex-1 flex gap-2">
                              <Textarea
                                placeholder="Escreva um comentário..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="flex-1 min-h-10"
                              />
                              <Button
                                size="sm"
                                onClick={() => addComment(post.id)}
                                disabled={!newComment.trim()}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}