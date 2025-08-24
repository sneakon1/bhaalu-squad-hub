import { useState } from 'react';
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
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@email.com',
    phone: '+91 98765 43210',
    position: 'Midfielder',
    favoritePlayer: 'Sunil Chhetri',
    bio: 'Passionate midfielder with 5+ years of experience. Love creating plays and supporting both offense and defense.',
    profilePicture: '',
    availableThisWeek: true,
    rating: 4.2,
    gamesPlayed: 47,
    goals: 12,
    assists: 23,
  });

  const [editProfile, setEditProfile] = useState<UserProfile>(profile);

  const handleInputChange = (field: keyof UserProfile, value: string | boolean) => {
    setEditProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    setProfile(editProfile);
    setIsEditing(false);
    toast({
      title: "Profile Updated",
      description: "Your profile has been successfully updated.",
    });
  };

  const handleCancel = () => {
    setEditProfile(profile);
    setIsEditing(false);
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
                  <AvatarImage src={isEditing ? editProfile.profilePicture : profile.profilePicture} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {profile.name.split(' ').map(n => n[0]).join('')}
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
                  {profile.name}
                </h2>
                <Badge variant="secondary" className="mt-2">
                  {profile.position}
                </Badge>
              </div>

              {/* Rating */}
              <div className="flex items-center justify-center space-x-2">
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.floor(profile.rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : star === Math.ceil(profile.rating)
                          ? 'text-yellow-400 fill-yellow-400 opacity-50'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-semibold text-foreground">
                  {profile.rating.toFixed(1)}
                </span>
              </div>

              {/* Weekly Availability */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {profile.availableThisWeek ? (
                      <CheckCircle className="w-5 h-5 text-accent" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                    <span className="font-medium">This Week Status</span>
                  </div>
                  <Badge variant={profile.availableThisWeek ? "default" : "secondary"}>
                    {profile.availableThisWeek ? 'Available' : 'Not Available'}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Card */}
          <Card className="card-field p-6 mt-6">
            <h3 className="text-lg font-poppins font-semibold mb-4">Career Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Games Played</span>
                <span className="font-semibold">{profile.gamesPlayed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Goals</span>
                <span className="font-semibold">{profile.goals}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assists</span>
                <span className="font-semibold">{profile.assists}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <Card className="card-field p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-poppins font-semibold">Personal Information</h3>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button onClick={handleSave} className="btn-action">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button onClick={handleCancel} variant="outline">
                    Cancel
                  </Button>
                </div>
              )}
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
                  value={isEditing ? editProfile.name : profile.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={isEditing ? editProfile.email : profile.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!isEditing}
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
                  value={isEditing ? editProfile.phone : profile.phone}
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
                  <Input value={profile.position} disabled />
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
                  value={isEditing ? editProfile.favoritePlayer : profile.favoritePlayer}
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
                    checked={isEditing ? editProfile.availableThisWeek : profile.availableThisWeek}
                    onCheckedChange={(checked) => handleInputChange('availableThisWeek', checked)}
                    disabled={!isEditing}
                  />
                  <span className="text-sm text-muted-foreground">
                    {(isEditing ? editProfile.availableThisWeek : profile.availableThisWeek) 
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
                value={isEditing ? editProfile.bio : profile.bio}
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