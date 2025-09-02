import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Star, 
  Camera, 
  Save, 
  Edit3,
  CheckCircle,
  XCircle 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  position: string;
  favoritePlayer: string;
  bio: string;
  profilePicture: string;
  availableThisWeek: boolean;
  rating: number;
  gamesPlayed: number;
  goals: number;
  assists: number;
}

const ProfileView = () => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editProfile, setEditProfile] = useState<UserProfile | null>(null);

  // Replace with actual logged-in user's email
  const userEmail = localStorage.getItem('userEmail') || '';
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Load draft from localStorage on mount
  const loadDraftFromStorage = () => {
    const draftKey = `profileDraft_${userEmail}`;
    const savedDraft = localStorage.getItem(draftKey);
    return savedDraft ? JSON.parse(savedDraft) : null;
  };

  // Save draft to localStorage
  const saveDraftToStorage = (data: UserProfile) => {
    const draftKey = `profileDraft_${userEmail}`;
    localStorage.setItem(draftKey, JSON.stringify(data));
  };

  // Clear draft from localStorage
  const clearDraftFromStorage = () => {
    const draftKey = `profileDraft_${userEmail}`;
    localStorage.removeItem(draftKey);
  };

  // Fetch profile from backend on mount
  React.useEffect(() => {
    if (!userEmail) {
      setFetchError('No user email found. Please log in.');
      return;
    }
    
    const fetchProfileWithRatings = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const profileRes = await fetch('https://bhaalu-squad-hub.onrender.com/api/profile/me', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await profileRes.json();
        
        if (data && data.email) {
          // Fetch ratings and stats from games
          const ratingsRes = await fetch(`https://bhaalu-squad-hub.onrender.com/games/player-ratings/${userEmail}`);
          const ratingsData = await ratingsRes.json();
          console.log('Ratings data:', ratingsData);
          
          const statsRes = await fetch(`https://bhaalu-squad-hub.onrender.com/games/player-stats/${userEmail}`);
          const statsData = await statsRes.json();
          console.log('Stats data:', statsData);
          console.log('User email for stats:', userEmail);
          
          const fetchedProfile = {
            name: data.name,
            email: data.email,
            phone: data.phone || '',
            position: data.preferredPosition || '',
            favoritePlayer: data.favPlayer || '',
            bio: data.aboutMe || '',
            profilePicture: data.profilePicture || '',
            availableThisWeek: data.availableThisWeek || false,
            rating: ratingsData.averageRating || 0,
            gamesPlayed: statsData.gamesPlayed || 0,
            goals: statsData.goals || 0,
            assists: statsData.assists || 0,
          };
          console.log('Final profile with stats:', fetchedProfile);
          setProfile(fetchedProfile);
          
          // Check if there's a saved draft
          const savedDraft = loadDraftFromStorage();
          if (savedDraft) {
            setEditProfile(savedDraft);
            setIsEditing(true);
          } else {
            setEditProfile(fetchedProfile);
            setIsEditing(false);
          }
        } else {
          // No profile found, check for saved draft or create new
          setProfile(null);
          const savedDraft = loadDraftFromStorage();
          if (savedDraft) {
            setEditProfile(savedDraft);
          } else {
            setEditProfile({
              name: '',
              email: userEmail,
              phone: '',
              position: '',
              favoritePlayer: '',
              bio: '',
              profilePicture: '',
              availableThisWeek: false,
              rating: 0,
              gamesPlayed: 0,
              goals: 0,
              assists: 0,
            });
          }
          setIsEditing(true);
        }
      } catch (err) {
        setFetchError('Failed to fetch profile. Please try again.');
      }
    };
    
    fetchProfileWithRatings();
  }, [userEmail]);


  React.useEffect(() => {
    if (profile && !isEditing) {
      setEditProfile(profile);
    }
  }, [profile, isEditing]);

  const handleInputChange = (field: keyof UserProfile, value: string | boolean) => {
    const updatedProfile = {
      ...editProfile,
      [field]: value
    };
    setEditProfile(updatedProfile);
    
    // Save to localStorage whenever form data changes
    if (isEditing) {
      saveDraftToStorage(updatedProfile);
    }
  };


  const handleSave = async () => {
    if (!editProfile) return;
    try {
      const token = localStorage.getItem('authToken');
      const method = profile ? 'PUT' : 'POST';
      const url = profile ? `https://bhaalu-squad-hub.onrender.com/api/profile/${profile.email}` : 'https://bhaalu-squad-hub.onrender.com/api/profile';
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          name: editProfile.name,
          email: editProfile.email,
          phone: editProfile.phone,
          preferredPosition: editProfile.position,
          favPlayer: editProfile.favoritePlayer,
          availableThisWeek: editProfile.availableThisWeek,
          aboutMe: editProfile.bio,
          profilePicture: editProfile.profilePicture,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Profile update failed');
      setProfile(editProfile);
      setIsEditing(false);
      // Clear draft from localStorage after successful save
      clearDraftFromStorage();
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };


  const handleCancel = () => {
    setEditProfile(profile);
    setIsEditing(false);
    // Clear draft from localStorage when canceling
    clearDraftFromStorage();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (isEditing) {
          handleInputChange('profilePicture', result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const positions = ['Goalkeeper', 'Defender', 'Midfielder', 'Striker'];


  if (fetchError) {
    return <div className="text-center py-12 text-red-500">{fetchError}</div>;
  }
  if (editProfile) {
    // Show profile form for new or existing user
    // ...existing code...
  } else {
    return <div className="text-center py-12">Loading profile...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-primary to-primary-light rounded-xl">
            <User className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-poppins font-bold text-foreground">
              User Profile
            </h1>
            <p className="text-muted-foreground">
              Manage your personal information and preferences
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Profile Picture & Basic Info */}
        <div className="lg:col-span-1">
          <Card className="card-field p-6">
            <div className="text-center space-y-4">
              {/* Profile Picture */}
              <div className="relative inline-block">
                <Avatar className="w-32 h-32 mx-auto">
                  <AvatarImage src={isEditing ? editProfile.profilePicture : profile?.profilePicture} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {editProfile.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                {isEditing && (
                  <label htmlFor="profile-picture" className="absolute bottom-0 right-0 p-2 bg-secondary text-secondary-foreground rounded-full cursor-pointer hover:bg-secondary/90 transition-colors">
                    <Camera className="w-4 h-4" />
                    <input
                      id="profile-picture"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Name and Position */}
              <div>
                <h2 className="text-2xl font-poppins font-bold text-foreground">
                  {editProfile.name}
                </h2>
                <Badge variant="secondary" className="mt-2">
                  {editProfile.position}
                </Badge>
              </div>

              {/* Rating - LOCKED */}
              <div className="flex items-center justify-center space-x-2">
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.floor(profile?.rating || 0)
                          ? 'text-yellow-400 fill-yellow-400'
                          : star === Math.ceil(profile?.rating || 0)
                          ? 'text-yellow-400 fill-yellow-400 opacity-50'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-semibold text-foreground">
                  {(profile?.rating || 0).toFixed(1)}
                </span>
              </div>

              {/* Weekly Availability */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {editProfile.availableThisWeek ? (
                      <CheckCircle className="w-5 h-5 text-accent" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                    <span className="font-medium">This Week Status</span>
                  </div>
                  <Badge variant={editProfile.availableThisWeek ? "default" : "secondary"}>
                    {editProfile.availableThisWeek ? 'Available' : 'Not Available'}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Card - LOCKED */}
          <Card className="card-field p-6 mt-6">
            <h3 className="text-lg font-poppins font-semibold mb-4">Career Stats (Read Only)</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Games Played</span>
                <span className="font-semibold">{profile?.gamesPlayed || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Goals</span>
                <span className="font-semibold">{profile?.goals || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assists</span>
                <span className="font-semibold">{profile?.assists || 0}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <Card className="card-field p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-poppins font-semibold">Personal Information</h3>
              {!isEditing && profile ? (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              ) : isEditing ? (
                <div className="flex space-x-2">
                  <Button onClick={handleSave} className="btn-action">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button onClick={handleCancel} variant="outline">
                    Cancel
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Full Name</span>
                </Label>
                <Input
                  id="name"
                  value={isEditing ? editProfile.name : profile?.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              {/* Email - LOCKED */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Email (Read Only)</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profile?.email || ''}
                  disabled={true}
                  className="bg-muted"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>Phone</span>
                </Label>
                <Input
                  id="phone"
                  value={isEditing ? editProfile.phone : profile?.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              {/* Position */}
              <div className="space-y-2">
                <Label htmlFor="position" className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Preferred Position</span>
                </Label>
                {isEditing ? (
                  <select
                    id="position"
                    value={editProfile.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {positions.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                ) : (
                  <Input value={profile?.position || ''} disabled />
                )}
              </div>

              {/* Favorite Player */}
              <div className="space-y-2">
                <Label htmlFor="favoritePlayer" className="flex items-center space-x-2">
                  <Star className="w-4 h-4" />
                  <span>Favorite Player</span>
                </Label>
                <Input
                  id="favoritePlayer"
                  value={isEditing ? editProfile.favoritePlayer : profile?.favoritePlayer || ''}
                  onChange={(e) => handleInputChange('favoritePlayer', e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              {/* Weekly Availability Toggle */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Available This Week</span>
                </Label>
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={isEditing ? editProfile.availableThisWeek : profile?.availableThisWeek || false}
                    onCheckedChange={(checked) => handleInputChange('availableThisWeek', checked)}
                    disabled={!isEditing}
                  />
                  <span className="text-sm text-muted-foreground">
                    {(isEditing ? editProfile.availableThisWeek : profile?.availableThisWeek) 
                      ? 'Ready to play' 
                      : 'Not available'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="mt-6 space-y-2">
              <Label htmlFor="bio">About Me</Label>
              <Textarea
                id="bio"
                value={isEditing ? editProfile.bio : profile?.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                disabled={!isEditing}
                rows={4}
                placeholder="Tell us about your football journey..."
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;